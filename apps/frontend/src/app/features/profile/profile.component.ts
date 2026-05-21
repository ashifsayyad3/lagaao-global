import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lg-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-8">
      <h1 class="font-display text-2xl font-bold text-text-primary">My Profile</h1>
      <p class="text-text-secondary mt-2">Profile management — Phase 2</p>
    </div>
  `,
})
export class ProfileComponent {}
