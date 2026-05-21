import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';

import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'lg-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatIconModule, MatTabsModule,
    ButtonComponent, BadgeComponent, SkeletonComponent,
  ],
  template: `
    <div class="max-w-4xl mx-auto px-4 md:px-6 py-8">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-accent
                    flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {{ initial() }}
        </div>
        <div>
          <h1 class="font-display text-2xl font-bold text-text-primary">{{ auth.user()?.name }}</h1>
          <p class="text-text-secondary text-sm">{{ auth.user()?.email }}</p>
          <lg-badge [variant]="roleBadge()" class="mt-1">{{ auth.user()?.role }}</lg-badge>
        </div>
      </div>

      <!-- Tabs -->
      <mat-tab-group animationDuration="200ms" dynamicHeight>

        <!-- Profile Tab -->
        <mat-tab label="Profile">
          <div class="py-6">
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4 max-w-md">
              <div>
                <label class="block text-sm font-medium text-text-primary mb-1.5">Full name</label>
                <input formControlName="name" type="text" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-primary mb-1.5">Phone number</label>
                <div class="flex gap-2">
                  <span class="h-11 px-3 flex items-center rounded-lg border border-border-default
                               bg-surface-100 dark:bg-surface-800 text-sm text-text-secondary">+91</span>
                  <input formControlName="phone" type="tel" class="input-field flex-1" placeholder="9876543210" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-text-primary mb-1.5">Email address</label>
                <input [value]="auth.user()?.email" type="email" class="input-field opacity-60" disabled />
                <p class="mt-1 text-xs text-text-muted">Email cannot be changed</p>
              </div>
              <lg-button type="submit" variant="primary" [loading]="saving()">Save changes</lg-button>
            </form>
          </div>
        </mat-tab>

        <!-- Addresses Tab -->
        <mat-tab label="Addresses">
          <div class="py-6 space-y-4">
            @if (loadingAddresses()) {
              @for (i of [1,2]; track i) {
                <div class="rounded-xl border border-border-default p-4 space-y-2">
                  <lg-skeleton height="1rem" width="40%"></lg-skeleton>
                  <lg-skeleton height="0.875rem" width="80%"></lg-skeleton>
                  <lg-skeleton height="0.875rem" width="60%"></lg-skeleton>
                </div>
              }
            } @else if (addresses().length === 0) {
              <div class="text-center py-12">
                <mat-icon class="!text-5xl text-text-muted mb-3">location_on</mat-icon>
                <p class="text-text-secondary">No saved addresses</p>
                <lg-button variant="outline" size="sm" class="mt-4" prefixIcon="add">
                  Add address
                </lg-button>
              </div>
            } @else {
              @for (addr of addresses(); track addr['id']) {
                <div class="rounded-xl border border-border-default p-4 relative">
                  @if (addr['isDefault']) {
                    <lg-badge variant="success" class="absolute top-3 right-3">Default</lg-badge>
                  }
                  <div class="flex items-center gap-2 mb-1">
                    <mat-icon class="!text-base text-text-muted">{{ addr['type'] === 'home' ? 'home' : 'work' }}</mat-icon>
                    <span class="font-medium text-sm capitalize">{{ addr['type'] }}</span>
                  </div>
                  <p class="text-sm text-text-primary font-medium">{{ addr['name'] }} · {{ addr['phone'] }}</p>
                  <p class="text-sm text-text-secondary mt-0.5">
                    {{ addr['line1'] }}{{ addr['line2'] ? ', ' + addr['line2'] : '' }},
                    {{ addr['city'] }}, {{ addr['state'] }} {{ addr['pincode'] }}
                  </p>
                </div>
              }
              <lg-button variant="outline" size="sm" prefixIcon="add">Add new address</lg-button>
            }
          </div>
        </mat-tab>

        <!-- Security Tab -->
        <mat-tab label="Security">
          <div class="py-6 max-w-md">
            <h3 class="font-semibold text-text-primary mb-4">Change password</h3>
            <form [formGroup]="pwForm" (ngSubmit)="changePassword()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-text-primary mb-1.5">Current password</label>
                <input formControlName="current" type="password" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-primary mb-1.5">New password</label>
                <input formControlName="newPw" type="password" class="input-field" />
              </div>
              <lg-button type="submit" variant="primary" [loading]="changingPw()">
                Update password
              </lg-button>
            </form>

            <div class="mt-8 pt-6 border-t border-border-default">
              <h3 class="font-semibold text-text-primary mb-1">Active sessions</h3>
              <p class="text-sm text-text-secondary mb-4">
                Sign out from all other devices
              </p>
              <lg-button variant="danger" size="sm" (click)="signOut()">
                Sign out everywhere
              </lg-button>
            </div>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`.input-field { width:100%; height:2.75rem; padding:0 1rem; border-radius:0.5rem; border:1px solid var(--border-default); background:var(--bg-base); color:var(--text-primary); font-size:0.875rem; transition:all 150ms; } .input-field:focus { outline:none; box-shadow:0 0 0 2px var(--color-primary); border-color:transparent; }`],
})
export class ProfileComponent implements OnInit {
  readonly auth  = inject(AuthService);
  readonly #api  = inject(ApiService);
  readonly #toast = inject(ToastService);
  readonly #fb   = inject(FormBuilder);

  readonly saving          = signal(false);
  readonly changingPw      = signal(false);
  readonly loadingAddresses = signal(true);
  readonly addresses        = signal<Record<string, unknown>[]>([]);

  profileForm = this.#fb.nonNullable.group({
    name:  [this.auth.user()?.name ?? '', Validators.required],
    phone: [this.auth.user()?.phone ?? ''],
  });

  pwForm = this.#fb.nonNullable.group({
    current: ['', Validators.required],
    newPw:   ['', [Validators.required, Validators.minLength(8)]],
  });

  initial = () => (this.auth.user()?.name?.[0] ?? 'U').toUpperCase();

  roleBadge(): 'primary' | 'warning' | 'error' {
    const r = this.auth.user()?.role;
    if (r === 'super_admin') return 'error';
    if (r === 'admin' || r === 'vendor') return 'warning';
    return 'primary';
  }

  ngOnInit(): void {
    this.#api.get<{ data: Record<string, unknown>[] }>('/users/addresses').subscribe({
      next: res => { this.addresses.set(res.data); this.loadingAddresses.set(false); },
      error: ()  => this.loadingAddresses.set(false),
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.saving()) return;
    this.saving.set(true);

    this.#api.patch('/users/profile', this.profileForm.getRawValue()).subscribe({
      next: () => { this.saving.set(false); this.#toast.success('Profile updated'); },
      error: () => this.saving.set(false),
    });
  }

  changePassword(): void {
    if (this.pwForm.invalid || this.changingPw()) return;
    this.changingPw.set(true);
    const { current, newPw } = this.pwForm.getRawValue();

    this.#api.post('/users/change-password', { currentPassword: current, newPassword: newPw }).subscribe({
      next: () => {
        this.changingPw.set(false);
        this.pwForm.reset();
        this.#toast.success('Password updated');
      },
      error: (err) => {
        this.changingPw.set(false);
        this.#toast.error('Failed', err.error?.message);
      },
    });
  }

  signOut(): void {
    this.auth.logout();
  }
}
