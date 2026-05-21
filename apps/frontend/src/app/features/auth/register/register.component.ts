import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'lg-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonComponent],
  template: `
    <div>
      <h2 class="font-display text-3xl font-bold text-text-primary mb-2">Create account</h2>
      <p class="text-text-secondary mb-8">Join millions of smart shoppers on Lagaao</p>
      <p class="text-sm text-text-muted">Full implementation — Phase 2</p>
      <div class="mt-6">
        <lg-button variant="primary" size="lg" [fullWidth]="true" routerLink="/">
          Continue as Guest
        </lg-button>
      </div>
      <p class="mt-4 text-center text-sm text-text-secondary">
        Already have an account?
        <a routerLink="/auth/login" class="text-primary-600 font-medium hover:underline">
          Sign in
        </a>
      </p>
    </div>
  `,
})
export class RegisterComponent {}
