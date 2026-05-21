import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./profile.component').then(m => m.ProfileComponent),
    title: 'My Profile — Lagaao',
  },
];
