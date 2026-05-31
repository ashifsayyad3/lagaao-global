import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lg-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styles: [`
    :host { display: inline-flex; }

    a {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex-shrink: 0;
    }

    /* Image — hidden until loaded */
    img {
      height: var(--lg-logo-h, 40px);
      width: auto;
      object-fit: contain;
      display: block;
    }

    /* ── Wordmark ────────────────────────────────────── */
    .wordmark {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -.02em;
      line-height: 1;
      white-space: nowrap;
    }

    .wordmark-leaf {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50% 50% 50% 10%;
      font-size: 1rem;
      flex-shrink: 0;
    }

    /* Default (color) variant */
    :host(:not(.white)) .wordmark { color: #111; }
    :host(:not(.white)) .wordmark-leaf {
      background: var(--color-primary, #3d6b45);
      color: #fff;
    }

    /* White variant — used on dark/colored backgrounds */
    :host(.white) img { filter: brightness(0) invert(1); }
    :host(.white) .wordmark { color: #fff; }
    :host(.white) .wordmark-leaf {
      background: rgba(255,255,255,.25);
      color: #fff;
    }
  `],
  template: `
    <a [routerLink]="href()">
      @if (!imgError()) {
        <img
          [src]="imgSrc"
          alt="Lagaao"
          [style.height]="size()"
          (error)="imgError.set(true)"
        />
      } @else {
        <!-- Wordmark fallback — only if image truly fails -->
        <span class="wordmark" [style.font-size]="wordmarkSize()">
          <span class="wordmark-leaf">🌿</span>
          Lagaao
        </span>
      }
    </a>
  `,
  host: {
    '[class.white]': 'variant() === "white"',
  },
})
export class LgLogoComponent {
  readonly variant = input<'default' | 'white'>('default');
  readonly size    = input<string>('40px');
  readonly href    = input<string>('/');

  readonly imgError  = signal(false);
  readonly imgSrc    = '/logo.png';

  wordmarkSize(): string {
    // Scale wordmark relative to the requested logo size
    const px = parseInt(this.size(), 10);
    if (isNaN(px)) return '1.5rem';
    const rem = Math.max(0.9, Math.min(2, px / 26));
    return `${rem.toFixed(2)}rem`;
  }
}
