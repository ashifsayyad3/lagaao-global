import { Routes } from '@angular/router';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./order-list/order-list.component').then(m => m.OrderListComponent),
    title: 'My Orders — Lagaao',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./order-detail/order-detail.component').then(m => m.OrderDetailComponent),
    title: 'Order Details — Lagaao',
  },
];
