import { Request } from 'express';
import { SupportTicket, SupportMessage, TicketStatus, TicketPriority, TicketCategory } from '../../models/supportTicket.model';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getPagination } from '../../shared/utils/paginate.util';

function genTicketNumber(): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `TKT-${ts}-${rnd}`;
}

const TICKET_INCLUDE = [
  { association: 'customer', attributes: ['id', 'name', 'email'] },
  { association: 'assignee', attributes: ['id', 'name'] },
  {
    model: SupportMessage,
    as: 'messages',
    include: [{ association: 'sender', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'ASC']] as [string, string][],
    required: false,
  },
];

export class SupportService {
  /** Customer: create new ticket */
  async create(userId: number, input: {
    subject: string;
    category: TicketCategory;
    body: string;
    orderId?: number;
    priority?: TicketPriority;
  }): Promise<SupportTicket> {
    const ticket = await SupportTicket.create({
      ticketNumber: genTicketNumber(),
      userId,
      orderId:  input.orderId  ?? null,
      subject:  input.subject,
      category: input.category,
      priority: input.priority ?? 'medium',
      status:   'open',
    });

    await SupportMessage.create({
      ticketId:   ticket.id,
      senderId:   userId,
      senderRole: 'customer',
      body:       input.body,
    });

    return ticket.reload({ include: TICKET_INCLUDE });
  }

  /** Customer: list own tickets */
  async listForUser(userId: number, req: Request) {
    const { limit, offset, page } = getPagination(req, 10);
    const { count, rows } = await SupportTicket.findAndCountAll({
      where: { userId },
      include: [{ association: 'customer', attributes: ['id', 'name'] }],
      limit, offset,
      order: [['updatedAt', 'DESC']],
    });
    return { tickets: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  /** Get ticket with messages — customer may only see own */
  async getOne(id: number, userId: number, isAdmin = false): Promise<SupportTicket> {
    const where = isAdmin ? { id } : { id, userId };
    const ticket = await SupportTicket.findOne({
      where,
      include: [
        { association: 'customer', attributes: ['id', 'name', 'email'] },
        { association: 'assignee', attributes: ['id', 'name'] },
        {
          model: SupportMessage,
          as: 'messages',
          where: isAdmin ? {} : { isInternal: false },
          include: [{ association: 'sender', attributes: ['id', 'name'] }],
          order: [['createdAt', 'ASC']] as [string, string][],
          required: false,
        },
      ],
    });
    if (!ticket) throw new AppError('Ticket not found', 404);
    return ticket;
  }

  /** Add a message (customer or admin) */
  async addMessage(ticketId: number, senderId: number, isAdmin: boolean, input: {
    body: string;
    isInternal?: boolean;
  }): Promise<SupportMessage> {
    const ticket = await SupportTicket.findByPk(ticketId);
    if (!ticket) throw new AppError('Ticket not found', 404);
    if (!isAdmin && ticket.userId !== senderId) throw new AppError('Forbidden', 403);
    if (['resolved', 'closed'].includes(ticket.status) && !isAdmin) {
      throw new AppError('Ticket is closed. Please open a new ticket.', 400);
    }

    const msg = await SupportMessage.create({
      ticketId,
      senderId,
      senderRole: isAdmin ? 'admin' : 'customer',
      body:       input.body,
      isInternal: isAdmin && (input.isInternal ?? false),
    });

    // Auto-update status
    const newStatus: TicketStatus = isAdmin ? 'pending_customer' : 'pending_admin';
    await ticket.update({ status: newStatus });

    return msg.reload({ include: [{ association: 'sender', attributes: ['id', 'name'] }] });
  }

  /** Admin: list all tickets */
  async adminList(req: Request) {
    const { limit, offset, page } = getPagination(req, 20);
    const status   = req.query['status']   as TicketStatus   | undefined;
    const priority = req.query['priority'] as TicketPriority | undefined;
    const where: Record<string, unknown> = {};
    if (status)   where['status']   = status;
    if (priority) where['priority'] = priority;

    const { count, rows } = await SupportTicket.findAndCountAll({
      where,
      include: [{ association: 'customer', attributes: ['id', 'name', 'email'] }],
      limit, offset,
      order: [
        ['priority', 'DESC'],  // urgent first
        ['updatedAt', 'DESC'],
      ],
    });
    return { tickets: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  /** Admin: update ticket status / priority / assignment */
  async adminUpdate(id: number, input: {
    status?:     TicketStatus;
    priority?:   TicketPriority;
    assignedTo?: number | null;
  }): Promise<SupportTicket> {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw new AppError('Ticket not found', 404);

    const updates: Partial<SupportTicket> = {};
    if (input.status   !== undefined) updates.status   = input.status;
    if (input.priority !== undefined) updates.priority = input.priority;
    if ('assignedTo' in input)        updates.assignedTo = input.assignedTo ?? null;
    if (input.status === 'resolved')  updates.resolvedAt = new Date();

    await ticket.update(updates);
    return ticket.reload({ include: TICKET_INCLUDE });
  }
}

export const supportService = new SupportService();
