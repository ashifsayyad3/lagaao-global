import {
  Component, OnInit, signal, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CmsService, Announcement } from '../../../core/services/cms.service';

@Component({
  selector: 'lg-announcement-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    @if (ann() && !dismissed()) {
      <div
        class="w-full text-center text-sm py-2 px-4 flex items-center justify-center gap-2 relative"
        [class]="bgClass()"
      >
        <span class="font-medium">{{ ann()!.message }}</span>
        @if (ann()!.link) {
          <a [href]="ann()!.link" class="underline font-semibold">{{ ann()!.linkLabel ?? 'Learn more' }}</a>
        }
        <button
          class="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
          (click)="dismissed.set(true)"
          aria-label="Dismiss"
        >
          <mat-icon class="!text-base !w-4 !h-4">close</mat-icon>
        </button>
      </div>
    }
  `,
})
export class AnnouncementBarComponent implements OnInit {
  readonly #cms   = inject(CmsService);
  readonly ann     = signal<Announcement | null>(null);
  readonly dismissed = signal(false);

  readonly bgClass = () => {
    const map: Record<string, string> = {
      info:    'bg-blue-600 text-white',
      warning: 'bg-amber-500 text-black',
      success: 'bg-green-600 text-white',
      promo:   'bg-gradient-to-r from-primary-700 to-primary-500 text-white',
    };
    return map[this.ann()?.type ?? 'info'];
  };

  ngOnInit() {
    this.#cms.getAnnouncement().subscribe(r => this.ann.set(r.data));
  }
}
