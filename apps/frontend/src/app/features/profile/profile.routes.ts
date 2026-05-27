import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./profile.component').then(m => m.ProfileComponent),
    title: 'My Profile — Lagaao',
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./wishlist/profile-wishlist.component').then(m => m.ProfileWishlistComponent),
    title: 'My Wishlist — Lagaao',
  },
  {
    path: 'wallet',
    loadComponent: () =>
      import('./wallet/profile-wallet.component').then(m => m.ProfileWalletComponent),
    title: 'My Wallet — Lagaao',
  },
  {
    path: 'support',
    loadComponent: () =>
      import('./support/profile-support.component').then(m => m.ProfileSupportComponent),
    title: 'Support — Lagaao',
  },
];
