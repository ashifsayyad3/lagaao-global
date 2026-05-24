import { Component, input, ChangeDetectionStrategy } from '@angular/core';
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

    img {
      height: var(--lg-logo-h, 40px);
      width: auto;
      object-fit: contain;
      display: block;
    }

    .wordmark {
      display: none;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -.01em;
      line-height: 1;
    }

    /* White variant — used on dark/colored backgrounds */
    :host(.white) img  { filter: brightness(0) invert(1); }
    :host(.white) .wordmark { color: #fff; }

    /* Default (color) variant */
    :host(:not(.white)) .wordmark { color: var(--color-primary); }
  `],
  template: `
    <a [routerLink]="href()">
      <img
        src="/logo.png"
        alt="Lagaao"
        [style.height]="size()"
        (error)="onError($event)"
      />
      <span class="wordmark" #wordmark>Lagaao</span>
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

  onError(e: Event): void {
    const img      = e.target as HTMLImageElement;
    const wordmark = img.nextElementSibling as HTMLElement;
    img.style.display      = 'none';
    wordmark.style.display = 'block';
  }
}
