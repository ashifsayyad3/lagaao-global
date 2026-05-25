import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal, computed,
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  VendorService, VendorCoupon, CreateCouponInput, VendorProfile,
} from '../../../core/services/vendor.service';

@Component({
  selector: 'lg-vendor-marketing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe, CurrencyPipe],
  template: `
<div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Marketing &amp; Coupons</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Create and manage discount coupons for your store</p>
    </div>
    <button
      (click)="openCreatePanel()"
      class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
    >
      <span class="material-icons text-[18px]">add</span>
      Create Coupon
    </button>
  </div>

  <!-- Stats Row -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <span class="material-icons text-blue-600 dark:text-blue-400 text-[20px]">confirmation_number</span>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Coupons</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ totalCount() }}</p>
        </div>
      </div>
    </div>
    <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
          <span class="material-icons text-emerald-600 dark:text-emerald-400 text-[20px]">check_circle</span>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Active Coupons</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ activeCount() }}</p>
        </div>
      </div>
    </div>
    <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
          <span class="material-icons text-purple-600 dark:text-purple-400 text-[20px]">trending_up</span>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Uses</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ totalUses() }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading -->
  @if (loading()) {
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      @for (n of [1,2,3,4,5,6]; track n) {
        <div class="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 w-2/3"></div>
          <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded mb-2 w-full"></div>
          <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
        </div>
      }
    </div>
  }

  <!-- Empty State -->
  @if (!loading() && coupons().length === 0) {
    <div class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <span class="material-icons text-gray-400 dark:text-gray-500 text-[40px]">local_offer</span>
      </div>
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No coupons yet</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-xs">Create your first discount coupon to attract more customers to your store.</p>
      <button
        (click)="openCreatePanel()"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
      >
        <span class="material-icons text-[18px]">add</span>
        Create your first coupon
      </button>
    </div>
  }

  <!-- Coupon Cards Grid -->
  @if (!loading() && coupons().length > 0) {
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
      @for (coupon of coupons(); track coupon.id) {
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-shadow hover:shadow-md"
             [class.opacity-60]="!coupon.isActive">

          <!-- Coupon Design Top -->
          <div class="relative bg-gradient-to-br"
               [class]="coupon.type === 'percent'
                 ? 'from-violet-500 to-purple-700'
                 : 'from-emerald-500 to-teal-700'">
            <!-- Dashed coupon body -->
            <div class="px-5 pt-5 pb-4">
              <div class="flex items-start justify-between mb-3">
                <!-- Type badge -->
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                      [class]="coupon.type === 'percent'
                        ? 'bg-white/20 text-white'
                        : 'bg-white/20 text-white'">
                  @if (coupon.type === 'percent') { <span>%</span> PERCENT OFF }
                  @else { <span>₹</span> FLAT OFF }
                </span>
                <!-- Scissors icon -->
                <span class="material-icons text-white/60 text-[18px] rotate-90">content_cut</span>
              </div>

              <!-- Value -->
              <div class="flex items-baseline gap-1 mb-1">
                @if (coupon.type === 'percent') {
                  <span class="text-4xl font-black text-white">{{ coupon.value }}%</span>
                  <span class="text-white/80 text-sm font-medium">OFF</span>
                } @else {
                  <span class="text-white/80 text-lg font-medium">₹</span>
                  <span class="text-4xl font-black text-white">{{ coupon.value }}</span>
                  <span class="text-white/80 text-sm font-medium">OFF</span>
                }
              </div>

              <!-- Code display with dashed border -->
              <div class="mt-3 border-2 border-dashed border-white/40 rounded-xl px-4 py-2 bg-white/10 backdrop-blur-sm">
                <p class="text-[10px] text-white/60 font-medium tracking-widest uppercase mb-0.5">Coupon Code</p>
                <p class="text-white font-black text-lg tracking-widest">{{ coupon.code }}</p>
              </div>
            </div>

            <!-- Notch divider -->
            <div class="relative flex items-center">
              <div class="absolute -left-3 w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800"></div>
              <div class="flex-1 border-t-2 border-dashed border-white/30 mx-3"></div>
              <div class="absolute -right-3 w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-950 border-l border-gray-100 dark:border-gray-800"></div>
            </div>
          </div>

          <!-- Coupon Details Bottom -->
          <div class="px-5 py-4">
            <!-- Stats row -->
            <div class="grid grid-cols-3 gap-2 mb-4">
              <div class="text-center">
                <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium mb-0.5">Uses</p>
                <p class="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {{ coupon.usedCount }}/{{ coupon.maxUses ?? '∞' }}
                </p>
              </div>
              <div class="text-center border-x border-gray-100 dark:border-gray-800">
                <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium mb-0.5">Min Order</p>
                <p class="text-sm font-bold text-gray-800 dark:text-gray-200">
                  @if (coupon.minOrderValue) { ₹{{ coupon.minOrderValue }} }
                  @else { — }
                </p>
              </div>
              <div class="text-center">
                <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium mb-0.5">Expires</p>
                <p class="text-sm font-bold text-gray-800 dark:text-gray-200">
                  @if (coupon.expiresAt) {
                    <span [class.text-red-500]="isExpired(coupon.expiresAt)">
                      {{ coupon.expiresAt | date:'d MMM' }}
                    </span>
                  } @else { Never }
                </p>
              </div>
            </div>

            @if (coupon.type === 'percent' && coupon.maxDiscount) {
              <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">
                <span class="material-icons text-[12px] align-middle mr-0.5">info</span>
                Max discount cap: ₹{{ coupon.maxDiscount }}
              </p>
            }

            <!-- Actions row -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <!-- Toggle switch -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  [attr.aria-checked]="coupon.isActive"
                  (click)="toggleCoupon(coupon)"
                  [disabled]="togglingId() === coupon.id"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
                  [class]="coupon.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
                    [class]="coupon.isActive ? 'translate-x-6' : 'translate-x-1'"
                  ></span>
                </button>
                <span class="text-xs font-medium" [class]="coupon.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'">
                  {{ coupon.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>

              <!-- Delete with inline confirm -->
              @if (deleteConfirmId() === coupon.id) {
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500 dark:text-gray-400">Sure?</span>
                  <button
                    (click)="confirmDelete(coupon.id)"
                    [disabled]="deletingId() === coupon.id"
                    class="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    @if (deletingId() === coupon.id) { ... } @else { Yes, Delete }
                  </button>
                  <button
                    (click)="deleteConfirmId.set(null)"
                    class="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
                  >Cancel</button>
                </div>
              } @else {
                <button
                  (click)="deleteConfirmId.set(coupon.id)"
                  class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete coupon"
                >
                  <span class="material-icons text-[18px]">delete_outline</span>
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Pagination -->
    @if (totalPages() > 1) {
      <div class="flex items-center justify-center gap-2">
        <button
          (click)="goToPage(currentPage() - 1)"
          [disabled]="currentPage() === 1"
          class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span class="material-icons text-[18px]">chevron_left</span>
        </button>

        @for (p of pageArray(); track p) {
          <button
            (click)="goToPage(p)"
            class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
            [class]="p === currentPage()
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
          >{{ p }}</button>
        }

        <button
          (click)="goToPage(currentPage() + 1)"
          [disabled]="currentPage() === totalPages()"
          class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span class="material-icons text-[18px]">chevron_right</span>
        </button>
      </div>
    }
  }
</div>

<!-- ════════════════════════ CREATE COUPON SLIDE-IN PANEL ════════════════════════ -->
@if (showPanel()) {
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 backdrop-blur-sm"
    (click)="closePanel()"
  ></div>

  <!-- Panel -->
  <div class="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col overflow-hidden">

    <!-- Panel Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">Create Coupon</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure your discount coupon</p>
      </div>
      <button
        (click)="closePanel()"
        class="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span class="material-icons text-[20px]">close</span>
      </button>
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-y-auto px-6 py-5">
      <form [formGroup]="couponForm" (ngSubmit)="submitCoupon()" novalidate>

        <!-- Code Suffix -->
        <div class="mb-5">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Coupon Code Suffix <span class="text-red-500">*</span>
          </label>
          <input
            formControlName="codeSuffix"
            type="text"
            placeholder="e.g. SUMMER20"
            (input)="onCodeSuffixInput($event)"
            class="w-full px-4 py-2.5 rounded-xl border text-sm font-mono uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            [class]="getFieldClass('codeSuffix')"
          />
          @if (couponForm.get('codeSuffix')?.invalid && couponForm.get('codeSuffix')?.touched) {
            <p class="text-xs text-red-500 mt-1">Code suffix is required (letters &amp; numbers only)</p>
          }
          <!-- Live Preview -->
          @if (codePreview()) {
            <div class="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <span class="material-icons text-emerald-600 dark:text-emerald-400 text-[16px]">visibility</span>
              <span class="text-xs text-emerald-700 dark:text-emerald-300">
                Your code will be: <strong class="font-mono tracking-widest">{{ codePreview() }}</strong>
              </span>
            </div>
          }
        </div>

        <!-- Type -->
        <div class="mb-5">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Discount Type <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="relative cursor-pointer">
              <input type="radio" formControlName="type" value="percent" class="sr-only" />
              <div class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center"
                   [class]="couponForm.get('type')?.value === 'percent'
                     ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                     : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                <span class="text-2xl font-black"
                      [class]="couponForm.get('type')?.value === 'percent' ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'">%</span>
                <span class="text-sm font-semibold"
                      [class]="couponForm.get('type')?.value === 'percent' ? 'text-violet-700 dark:text-violet-300' : 'text-gray-500 dark:text-gray-400'">Percentage</span>
              </div>
            </label>
            <label class="relative cursor-pointer">
              <input type="radio" formControlName="type" value="fixed" class="sr-only" />
              <div class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center"
                   [class]="couponForm.get('type')?.value === 'fixed'
                     ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                     : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                <span class="text-2xl font-black"
                      [class]="couponForm.get('type')?.value === 'fixed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'">₹</span>
                <span class="text-sm font-semibold"
                      [class]="couponForm.get('type')?.value === 'fixed' ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'">Fixed Amount</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Value -->
        <div class="mb-5">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {{ couponForm.get('type')?.value === 'percent' ? 'Discount Percentage' : 'Discount Amount (₹)' }}
            <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
              {{ couponForm.get('type')?.value === 'percent' ? '%' : '₹' }}
            </span>
            <input
              formControlName="value"
              type="number"
              [min]="1"
              [max]="couponForm.get('type')?.value === 'percent' ? 100 : undefined"
              placeholder="0"
              class="w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              [class]="getFieldClass('value')"
            />
          </div>
          @if (couponForm.get('value')?.invalid && couponForm.get('value')?.touched) {
            <p class="text-xs text-red-500 mt-1">Enter a valid value</p>
          }
        </div>

        <!-- Max Discount Cap (percent only) -->
        @if (couponForm.get('type')?.value === 'percent') {
          <div class="mb-5">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Max Discount Cap (₹) <span class="text-gray-400 font-normal">— optional</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
              <input
                formControlName="maxDiscount"
                type="number"
                min="1"
                placeholder="No cap"
                class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        }

        <!-- Min Order Value -->
        <div class="mb-5">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Min Order Value (₹) <span class="text-gray-400 font-normal">— optional</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
            <input
              formControlName="minOrderValue"
              type="number"
              min="0"
              placeholder="No minimum"
              class="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Max Uses & Max Uses Per User -->
        <div class="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Max Uses <span class="text-gray-400 font-normal text-xs">optional</span>
            </label>
            <input
              formControlName="maxUses"
              type="number"
              min="1"
              placeholder="Unlimited"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Per User <span class="text-gray-400 font-normal text-xs">optional</span>
            </label>
            <input
              formControlName="maxUsesPerUser"
              type="number"
              min="1"
              placeholder="Unlimited"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Expiry Date -->
        <div class="mb-6">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Expiry Date <span class="text-gray-400 font-normal">— optional</span>
          </label>
          <input
            formControlName="expiresAt"
            type="date"
            [min]="todayStr"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <!-- Submit Error -->
        @if (createError()) {
          <div class="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
            <span class="material-icons text-red-500 text-[18px] mt-0.5 shrink-0">error_outline</span>
            <p class="text-sm text-red-700 dark:text-red-300">{{ createError() }}</p>
          </div>
        }
      </form>
    </div>

    <!-- Panel Footer -->
    <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 shrink-0 bg-white dark:bg-gray-900">
      <button
        type="button"
        (click)="closePanel()"
        class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >Cancel</button>
      <button
        type="button"
        (click)="submitCoupon()"
        [disabled]="creating() || couponForm.invalid"
        class="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        @if (creating()) {
          <span class="inline-flex items-center gap-2">
            <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            Creating...
          </span>
        } @else {
          Create Coupon
        }
      </button>
    </div>
  </div>
}
  `,
})
export class VendorMarketingComponent implements OnInit {
  readonly #vendor = inject(VendorService);
  readonly #fb = inject(FormBuilder);

  // ── State ─────────────────────────────────────────────────────────────────
  loading = signal(true);
  coupons = signal<VendorCoupon[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);

  togglingId = signal<number | null>(null);
  deletingId = signal<number | null>(null);
  deleteConfirmId = signal<number | null>(null);

  showPanel = signal(false);
  creating = signal(false);
  createError = signal<string | null>(null);

  vendorId = signal<number | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  activeCount = computed(() => this.coupons().filter(c => c.isActive).length);
  totalUses = computed(() => this.coupons().reduce((sum, c) => sum + c.usedCount, 0));
  pageArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  codePreview = computed(() => {
    const suffix = this.couponForm?.get('codeSuffix')?.value ?? '';
    if (!suffix) return null;
    const id = this.vendorId();
    return id ? `VND${id}-${suffix.toUpperCase()}` : `VND???-${suffix.toUpperCase()}`;
  });

  // ── Form ──────────────────────────────────────────────────────────────────
  couponForm: FormGroup = this.#fb.group({
    codeSuffix:    ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
    type:          ['percent', Validators.required],
    value:         [null, [Validators.required, Validators.min(1)]],
    minOrderValue: [null],
    maxDiscount:   [null],
    maxUses:       [null],
    maxUsesPerUser:[null],
    expiresAt:     [null],
  });

  readonly todayStr = new Date().toISOString().split('T')[0];

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.#vendor.getMyProfile().subscribe({
      next: r => this.vendorId.set(r.data.id),
      error: () => {},
    });
    this.loadCoupons();
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  loadCoupons(): void {
    this.loading.set(true);
    this.#vendor.getVendorCoupons(this.currentPage()).subscribe({
      next: r => {
        this.coupons.set(r.data);
        this.totalPages.set(r.meta.totalPages);
        this.totalCount.set(r.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadCoupons();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  toggleCoupon(coupon: VendorCoupon): void {
    if (this.togglingId() !== null) return;
    this.togglingId.set(coupon.id);
    this.#vendor.toggleVendorCoupon(coupon.id).subscribe({
      next: r => {
        this.coupons.update(list =>
          list.map(c => c.id === coupon.id ? { ...c, isActive: r.data.isActive } : c)
        );
        this.togglingId.set(null);
      },
      error: () => this.togglingId.set(null),
    });
  }

  confirmDelete(id: number): void {
    this.deletingId.set(id);
    this.#vendor.deleteVendorCoupon(id).subscribe({
      next: () => {
        this.coupons.update(list => list.filter(c => c.id !== id));
        this.totalCount.update(n => n - 1);
        this.deletingId.set(null);
        this.deleteConfirmId.set(null);
      },
      error: () => {
        this.deletingId.set(null);
        this.deleteConfirmId.set(null);
      },
    });
  }

  // ── Panel ─────────────────────────────────────────────────────────────────
  openCreatePanel(): void {
    this.couponForm.reset({ type: 'percent' });
    this.createError.set(null);
    this.showPanel.set(true);
  }

  closePanel(): void {
    this.showPanel.set(false);
  }

  onCodeSuffixInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.couponForm.patchValue({ codeSuffix: upper }, { emitEvent: false });
    input.value = upper;
  }

  submitCoupon(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    const raw = this.couponForm.value;
    const payload: CreateCouponInput = {
      codeSuffix:    raw.codeSuffix,
      type:          raw.type,
      value:         Number(raw.value),
      ...(raw.minOrderValue  ? { minOrderValue:   Number(raw.minOrderValue)  } : {}),
      ...(raw.maxDiscount    ? { maxDiscount:      Number(raw.maxDiscount)    } : {}),
      ...(raw.maxUses        ? { maxUses:          Number(raw.maxUses)        } : {}),
      ...(raw.maxUsesPerUser ? { maxUsesPerUser:   Number(raw.maxUsesPerUser) } : {}),
      ...(raw.expiresAt      ? { expiresAt:        raw.expiresAt              } : {}),
    };

    this.#vendor.createVendorCoupon(payload).subscribe({
      next: r => {
        this.coupons.update(list => [r.data, ...list]);
        this.totalCount.update(n => n + 1);
        this.creating.set(false);
        this.closePanel();
      },
      error: (err) => {
        this.createError.set(err?.error?.message ?? 'Failed to create coupon. Please try again.');
        this.creating.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  getFieldClass(field: string): string {
    const ctrl = this.couponForm.get(field);
    const invalid = ctrl?.invalid && ctrl?.touched;
    return invalid
      ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10 text-gray-900 dark:text-gray-100'
      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500';
  }
}
