import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lg-admin-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
<div class="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
  <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
    <span class="material-icons text-slate-500 text-[32px]">{{ icon() }}</span>
  </div>
  <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ title() }}</h2>
  <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{{ description() }}</p>
  <div class="flex items-center gap-2 mt-2">
    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
      <span class="material-icons text-[12px]">construction</span>
      In Development
    </span>
    <a routerLink="/admin" class="text-xs text-green-600 dark:text-green-400 hover:underline">← Dashboard</a>
  </div>
</div>
  `,
})
export class AdminPlaceholderComponent {
  readonly title       = input('Coming Soon');
  readonly icon        = input('construction');
  readonly description = input('This module is under active development.');
}
