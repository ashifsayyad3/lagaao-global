import { User, Address } from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';

export class UsersService {
  async getProfile(userId: number): Promise<User> {
    const user = await User.findByPk(userId, {
      include: [{ model: Address }],
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateProfile(
    userId: number,
    data: { name?: string; phone?: string; avatar?: string },
  ): Promise<User> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    await user.update(data);
    return user;
  }

  async getAddresses(userId: number): Promise<Address[]> {
    return Address.findAll({ where: { userId }, order: [['isDefault', 'DESC'], ['createdAt', 'ASC']] });
  }

  async addAddress(userId: number, data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Address> {
    if (data.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId } });
    }
    return Address.create({ ...data, userId });
  }

  async updateAddress(userId: number, addressId: number, data: Partial<Address>): Promise<Address> {
    const address = await Address.findOne({ where: { id: addressId, userId } });
    if (!address) throw new AppError('Address not found', 404);

    if (data.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId } });
    }
    await address.update(data);
    return address;
  }

  async deleteAddress(userId: number, addressId: number): Promise<void> {
    const address = await Address.findOne({ where: { id: addressId, userId } });
    if (!address) throw new AppError('Address not found', 404);
    await address.destroy();
  }

  async changePassword(userId: number, currentPw: string, newPw: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    const valid = await user.comparePassword(currentPw);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    user.passwordHash = newPw;
    await user.save();
  }
}

export const usersService = new UsersService();
