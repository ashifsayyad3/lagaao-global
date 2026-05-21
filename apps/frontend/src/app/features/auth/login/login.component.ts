import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'lg-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonComponent],
  template: `
    <div>
      <h2 class="font-display text-3xl font-bold text-text-primary mb-2">Welcome back</h2>
      <p class="text-text-secondary mb-8">Sign in to your Lagaao account</p>
      <p class="text-sm text-text-muted">Full implementation — Phase 2</p>
      <div class="mt-6">
        <lg-button variant="primary" size="lg" [fullWidth]="true" routerLink="/">
          Continue as Guest
        </lg-button>
      </div>
      <p class="mt-4 text-center text-sm text-text-secondary">
        No account?
        <a routerLink="/auth/register" class="text-primary-600 font-medium hover:underline">
          Create one
        </a>
      </p>
    </div>
  `,
})
export class LoginComponent {}
