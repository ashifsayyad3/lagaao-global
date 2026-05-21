import {
  Directive, ElementRef, Input, OnInit, inject
} from '@angular/core';

@Directive({
  selector: 'img[lgLazy]',
  standalone: true,
})
export class LazyImgDirective implements OnInit {
  @Input() lgLazy!: string;
  @Input() placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';

  readonly #el = inject(ElementRef<HTMLImageElement>);

  ngOnInit(): void {
    const img = this.#el.nativeElement;
    img.src = this.placeholder;
    img.classList.add('skeleton');

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const real = new Image();
        real.onload = () => {
          img.src = this.lgLazy;
          img.classList.remove('skeleton');
          img.classList.add('animate-fade-in');
        };
        real.src = this.lgLazy;
        observer.disconnect();
      }
    }, { rootMargin: '200px' });

    observer.observe(img);
  }
}
