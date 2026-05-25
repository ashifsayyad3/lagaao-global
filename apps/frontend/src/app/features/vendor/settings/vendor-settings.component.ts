import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  VendorService,
  VendorProfile,
} from '../../../core/services/vendor.service';

const INDIAN_STATES: string[] = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi',
  'Jammu & Kashmir','Ladakh','Puducherry','Chandigarh',
];

type TabId = 'store' | 'business' | 'bank' | 'platform';

interface TabDef { id: TabId; label: string; icon: string; }

@Component({
  selector: 'lg-vendor-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Store Settings</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your vendor profile, business details, and banking information.
        </p>
      </div>

      <!-- Loading skeleton -->
      @if (loading()) {
        <div class="space-y-4 max-w-3xl">
          @for (i of [1,2,3]; track i) {
            <div class="h-10 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
          }
        </div>
      }

      <!-- Error state -->
      @if (!loading() && loadError()) {
        <div class="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300 max-w-3xl">
          <strong>Failed to load settings.</strong> {{ loadError() }}
        </div>
      }

      <!-- Main content -->
      @if (!loading() && !loadError() && profile()) {
        <div class="max-w-3xl">

          <!-- Tab bar -->
          <div class="flex gap-1 rounded-xl bg-gray-200 dark:bg-gray-800 p-1 mb-6 overflow-x-auto">
            @for (tab of tabs; track tab.id) {
              <button
                type="button"
                (click)="activeTab.set(tab.id)"
                class="flex items-center gap-2 flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150"
                [class.bg-white]="activeTab() === tab.id"
                [class.dark:bg-gray-700]="activeTab() === tab.id"
                [class.shadow-sm]="activeTab() === tab.id"
                [class.text-primary-600]="activeTab() === tab.id"
                [class.dark:text-primary-400]="activeTab() === tab.id"
                [class.text-gray-600]="activeTab() !== tab.id"
                [class.dark:text-gray-400]="activeTab() !== tab.id"
              >
                <span class="material-icons text-base leading-none">{{ tab.icon }}</span>
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- ── Tab 1: Store Profile ── -->
          @if (activeTab() === 'store') {
            <form [formGroup]="storeForm" (ngSubmit)="saveStore()" class="space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Store Profile</h2>

              <!-- Logo -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
                <div class="flex items-center gap-4">
                  <div class="h-16 w-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    @if (storeForm.get('logo')?.value) {
                      <img [src]="storeForm.get('logo')?.value" alt="Logo preview" class="h-full w-full object-cover" />
                    } @else {
                      <span class="material-icons text-3xl text-gray-400">store</span>
                    }
                  </div>
                  <input formControlName="logo" type="url" placeholder="https://…"
                    class="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              <!-- Banner -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banner URL</label>
                @if (storeForm.get('banner')?.value) {
                  <div class="mb-2 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    <img [src]="storeForm.get('banner')?.value" alt="Banner preview" class="h-full w-full object-cover" />
                  </div>
                }
                <input formControlName="banner" type="url" placeholder="https://…"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <!-- Store Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name <span class="text-red-500">*</span></label>
                <input formControlName="storeName" type="text"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  [class.border-red-400]="storeForm.get('storeName')?.invalid && storeForm.get('storeName')?.touched" />
                @if (storeForm.get('storeName')?.invalid && storeForm.get('storeName')?.touched) {
                  <p class="mt-1 text-xs text-red-500">Store name is required.</p>
                }
              </div>

              <!-- Store Slug (read-only) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Slug</label>
                <div class="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
                  <span class="material-icons text-sm text-gray-400">link</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">{{ profile()?.storeSlug }}</span>
                </div>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">Slug cannot be changed after creation.</p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea formControlName="description" rows="4" placeholder="Tell customers about your store…"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
              </div>

              <!-- Website -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website URL</label>
                <input formControlName="website" type="url" placeholder="https://yoursite.com"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <!-- Save -->
              <div>
                <button type="submit"
                  [disabled]="storeForm.invalid || savingStore()"
                  class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  @if (savingStore()) {
                    <span class="material-icons text-base animate-spin">refresh</span> Saving…
                  } @else {
                    <span class="material-icons text-base">save</span> Save Store Profile
                  }
                </button>
                @if (storeToast()) {
                  <p class="mt-2 text-sm" [class.text-green-600]="storeToast()!.type === 'success'" [class.dark:text-green-400]="storeToast()!.type === 'success'"
                    [class.text-red-600]="storeToast()!.type === 'error'" [class.dark:text-red-400]="storeToast()!.type === 'error'">
                    {{ storeToast()!.message }}
                  </p>
                }
              </div>
            </form>
          }

          <!-- ── Tab 2: Business Details ── -->
          @if (activeTab() === 'business') {
            <form [formGroup]="businessForm" (ngSubmit)="saveBusiness()" class="space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Business Details</h2>

              <!-- GSTIN -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GSTIN</label>
                <input formControlName="gstin" type="text" maxlength="15" placeholder="22AAAAA0000A1Z5"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono uppercase text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  [class.border-red-400]="businessForm.get('gstin')?.invalid && businessForm.get('gstin')?.touched" />
                @if (businessForm.get('gstin')?.errors?.['maxlength'] && businessForm.get('gstin')?.touched) {
                  <p class="mt-1 text-xs text-red-500">GSTIN must be exactly 15 characters.</p>
                }
              </div>

              <!-- PAN -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN</label>
                <input formControlName="pan" type="text" maxlength="10" placeholder="ABCDE1234F"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono uppercase text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  [class.border-red-400]="businessForm.get('pan')?.invalid && businessForm.get('pan')?.touched" />
                @if (businessForm.get('pan')?.errors?.['maxlength'] && businessForm.get('pan')?.touched) {
                  <p class="mt-1 text-xs text-red-500">PAN must be exactly 10 characters.</p>
                }
              </div>

              <!-- Address section -->
              <div class="border-t border-gray-100 dark:border-gray-800 pt-4" formGroupName="address">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Business Address</h3>

                <div class="space-y-4">
                  <!-- Line 1 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 1</label>
                    <input formControlName="line1" type="text" placeholder="Street / building / locality"
                      class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <!-- City -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                      <input formControlName="city" type="text" placeholder="Mumbai"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    <!-- State -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                      <select formControlName="state"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Select state</option>
                        @for (state of indianStates; track state) {
                          <option [value]="state">{{ state }}</option>
                        }
                      </select>
                    </div>

                    <!-- Pincode -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                      <input formControlName="pincode" type="text" maxlength="6" placeholder="400001"
                        class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Save -->
              <div>
                <button type="submit"
                  [disabled]="businessForm.invalid || savingBusiness()"
                  class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  @if (savingBusiness()) {
                    <span class="material-icons text-base animate-spin">refresh</span> Saving…
                  } @else {
                    <span class="material-icons text-base">save</span> Save Business Details
                  }
                </button>
                @if (businessToast()) {
                  <p class="mt-2 text-sm" [class.text-green-600]="businessToast()!.type === 'success'" [class.dark:text-green-400]="businessToast()!.type === 'success'"
                    [class.text-red-600]="businessToast()!.type === 'error'" [class.dark:text-red-400]="businessToast()!.type === 'error'">
                    {{ businessToast()!.message }}
                  </p>
                }
              </div>
            </form>
          }

          <!-- ── Tab 3: Bank Details ── -->
          @if (activeTab() === 'bank') {
            <form [formGroup]="bankForm" (ngSubmit)="saveBank()" class="space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Bank Details</h2>

              <!-- Warning banner -->
              <div class="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3">
                <span class="material-icons text-amber-500 text-base mt-0.5">warning</span>
                <p class="text-sm text-amber-800 dark:text-amber-300">
                  Bank details are used for payout processing. Keep them accurate.
                </p>
              </div>

              <!-- Account Holder -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Holder Name</label>
                <input formControlName="accountHolder" type="text" placeholder="Full name as on bank account"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <!-- Account Number -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                <input formControlName="accountNumber" type="text" placeholder="Enter account number"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <!-- IFSC -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code</label>
                <input formControlName="ifsc" type="text" maxlength="11" placeholder="SBIN0001234"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono uppercase text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <!-- Bank Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                <input formControlName="bankName" type="text" placeholder="e.g. State Bank of India"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <!-- Save -->
              <div>
                <button type="submit"
                  [disabled]="bankForm.invalid || savingBank()"
                  class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  @if (savingBank()) {
                    <span class="material-icons text-base animate-spin">refresh</span> Saving…
                  } @else {
                    <span class="material-icons text-base">save</span> Save Bank Details
                  }
                </button>
                @if (bankToast()) {
                  <p class="mt-2 text-sm" [class.text-green-600]="bankToast()!.type === 'success'" [class.dark:text-green-400]="bankToast()!.type === 'success'"
                    [class.text-red-600]="bankToast()!.type === 'error'" [class.dark:text-red-400]="bankToast()!.type === 'error'">
                    {{ bankToast()!.message }}
                  </p>
                }
              </div>
            </form>
          }

          <!-- ── Tab 4: Platform Info ── -->
          @if (activeTab() === 'platform') {
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-6">
              <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Platform Info</h2>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <!-- Commission Rate -->
                <div class="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
                  <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Commission Rate</p>
                  <span class="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 text-sm font-bold">
                    <span class="material-icons text-sm">percent</span>
                    {{ profile()?.commissionRate ?? 0 }}%
                  </span>
                </div>

                <!-- Verification Status -->
                <div class="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
                  <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Verification</p>
                  @if (profile()?.isVerified) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 text-sm font-semibold">
                      <span class="material-icons text-sm">verified</span> Verified
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-3 py-1 text-sm font-semibold">
                      <span class="material-icons text-sm">pending</span> Not Verified
                    </span>
                  }
                </div>

                <!-- Store Status -->
                <div class="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
                  <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Store Status</p>
                  <span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold capitalize"
                    [class.bg-green-100]="profile()?.status === 'active'"
                    [class.dark:bg-green-900]="profile()?.status === 'active'"
                    [class.text-green-700]="profile()?.status === 'active'"
                    [class.dark:text-green-300]="profile()?.status === 'active'"
                    [class.bg-yellow-100]="profile()?.status === 'pending'"
                    [class.dark:bg-yellow-900]="profile()?.status === 'pending'"
                    [class.text-yellow-700]="profile()?.status === 'pending'"
                    [class.dark:text-yellow-300]="profile()?.status === 'pending'"
                    [class.bg-red-100]="profile()?.status === 'suspended' || profile()?.status === 'rejected'"
                    [class.dark:bg-red-900]="profile()?.status === 'suspended' || profile()?.status === 'rejected'"
                    [class.text-red-700]="profile()?.status === 'suspended' || profile()?.status === 'rejected'"
                    [class.dark:text-red-300]="profile()?.status === 'suspended' || profile()?.status === 'rejected'">
                    <span class="material-icons text-sm">circle</span>
                    {{ profile()?.status }}
                  </span>
                </div>

                <!-- Member Since -->
                @if (profileCreatedAt()) {
                  <div class="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Member Since</p>
                    <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {{ profileCreatedAt() | date: 'mediumDate' }}
                    </p>
                  </div>
                }

              </div>
            </div>
          }

        </div>
      }

    </div>
  `,
})
export class VendorSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private vendorService = inject(VendorService);

  readonly indianStates = INDIAN_STATES;

  readonly tabs: TabDef[] = [
    { id: 'store',    label: 'Store Profile',    icon: 'storefront'     },
    { id: 'business', label: 'Business Details', icon: 'business_center' },
    { id: 'bank',     label: 'Bank Details',     icon: 'account_balance' },
    { id: 'platform', label: 'Platform Info',    icon: 'info'            },
  ];

  activeTab  = signal<TabId>('store');
  loading    = signal(true);
  loadError  = signal<string | null>(null);
  profile    = signal<VendorProfile | null>(null);

  profileCreatedAt = computed(() => (this.profile() as (VendorProfile & { createdAt?: string }) | null)?.createdAt ?? null);

  savingStore    = signal(false);
  savingBusiness = signal(false);
  savingBank     = signal(false);

  storeToast    = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  businessToast = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  bankToast     = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  storeForm: FormGroup = this.fb.group({
    logo:        [''],
    banner:      [''],
    storeName:   ['', Validators.required],
    description: [''],
    website:     [''],
  });

  businessForm: FormGroup = this.fb.group({
    gstin:   ['', [Validators.maxLength(15)]],
    pan:     ['', [Validators.maxLength(10)]],
    address: this.fb.group({
      line1:   [''],
      city:    [''],
      state:   [''],
      pincode: [''],
    }),
  });

  bankForm: FormGroup = this.fb.group({
    accountHolder: [''],
    accountNumber: [''],
    ifsc:          [''],
    bankName:      [''],
  });

  ngOnInit(): void {
    this.vendorService.getMyProfile().subscribe({
      next: (res) => {
        const p = res.data;
        this.profile.set(p);

        this.storeForm.patchValue({
          logo:        p.logo        ?? '',
          banner:      p.banner      ?? '',
          storeName:   p.storeName,
          description: p.description ?? '',
          website:     p.website     ?? '',
        });

        this.businessForm.patchValue({
          gstin: p.gstin ?? '',
          pan:   p.pan   ?? '',
          address: {
            line1:   p.address?.line1   ?? '',
            city:    p.address?.city    ?? '',
            state:   p.address?.state   ?? '',
            pincode: p.address?.pincode ?? '',
          },
        });

        if (p.bankDetails) {
          this.bankForm.patchValue({
            accountHolder: p.bankDetails.accountHolder,
            accountNumber: p.bankDetails.accountNumber,
            ifsc:          p.bankDetails.ifsc,
            bankName:      p.bankDetails.bankName,
          });
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(err?.error?.message ?? 'Unable to load profile.');
        this.loading.set(false);
      },
    });
  }

  saveStore(): void {
    if (this.storeForm.invalid) return;
    this.savingStore.set(true);
    this.storeToast.set(null);

    const { logo, banner, storeName, description, website } = this.storeForm.value;
    const payload: Partial<VendorProfile> = {
      logo:        logo        || null,
      banner:      banner      || null,
      storeName,
      description: description || null,
      website:     website     || null,
    };

    this.vendorService.updateProfile(payload).subscribe({
      next: () => {
        this.savingStore.set(false);
        this.storeToast.set({ type: 'success', message: 'Store profile saved successfully.' });
        this.clearToast(this.storeToast);
      },
      error: (err) => {
        this.savingStore.set(false);
        this.storeToast.set({ type: 'error', message: err?.error?.message ?? 'Failed to save store profile.' });
      },
    });
  }

  saveBusiness(): void {
    if (this.businessForm.invalid) return;
    this.savingBusiness.set(true);
    this.businessToast.set(null);

    const { gstin, pan, address } = this.businessForm.value;
    const payload: Partial<VendorProfile> = {
      gstin:   gstin || null,
      pan:     pan   || null,
      address: (address.line1 || address.city || address.state || address.pincode)
        ? { line1: address.line1, city: address.city, state: address.state, pincode: address.pincode }
        : null,
    };

    this.vendorService.updateProfile(payload).subscribe({
      next: () => {
        this.savingBusiness.set(false);
        this.businessToast.set({ type: 'success', message: 'Business details saved successfully.' });
        this.clearToast(this.businessToast);
      },
      error: (err) => {
        this.savingBusiness.set(false);
        this.businessToast.set({ type: 'error', message: err?.error?.message ?? 'Failed to save business details.' });
      },
    });
  }

  saveBank(): void {
    if (this.bankForm.invalid) return;
    this.savingBank.set(true);
    this.bankToast.set(null);

    const { accountHolder, accountNumber, ifsc, bankName } = this.bankForm.value;
    const payload: Partial<VendorProfile> = {
      bankDetails: (accountHolder || accountNumber || ifsc || bankName)
        ? { accountHolder, accountNumber, ifsc, bankName }
        : null,
    };

    this.vendorService.updateProfile(payload).subscribe({
      next: () => {
        this.savingBank.set(false);
        this.bankToast.set({ type: 'success', message: 'Bank details saved successfully.' });
        this.clearToast(this.bankToast);
      },
      error: (err) => {
        this.savingBank.set(false);
        this.bankToast.set({ type: 'error', message: err?.error?.message ?? 'Failed to save bank details.' });
      },
    });
  }

  private clearToast(
    toastSignal: ReturnType<typeof signal<{ type: 'success' | 'error'; message: string } | null>>,
    delay = 4000,
  ): void {
    setTimeout(() => toastSignal.set(null), delay);
  }
}
