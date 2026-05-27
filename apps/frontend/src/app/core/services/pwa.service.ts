import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

export type InstallState = 'idle' | 'available' | 'installed' | 'unsupported';

@Injectable({ providedIn: 'root' })
export class PwaService {
  readonly #platformId  = inject(PLATFORM_ID);
  readonly #swUpdate    = inject(SwUpdate, { optional: true });

  // ─── Install prompt ───────────────────────────────────────────────────────
  readonly #installPrompt = signal<BeforeInstallPromptEvent | null>(null);
  readonly canInstall     = computed(() => !!this.#installPrompt());

  // ─── Update state ─────────────────────────────────────────────────────────
  readonly updateAvailable = signal(false);

  // ─── Online state ─────────────────────────────────────────────────────────
  readonly isOnline = signal(true);

  // ─── SW active ────────────────────────────────────────────────────────────
  readonly swEnabled = computed(() => !!this.#swUpdate?.isEnabled);

  constructor() {
    if (!isPlatformBrowser(this.#platformId)) return;

    // Track online / offline
    this.isOnline.set(navigator.onLine);
    window.addEventListener('online',  () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));

    // Capture install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.#installPrompt.set(e as BeforeInstallPromptEvent);
    });

    window.addEventListener('appinstalled', () => {
      this.#installPrompt.set(null);
    });

    // Listen for SW updates
    this.#swUpdate?.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.updateAvailable.set(true));

    // Check for update every 6 hours
    if (this.#swUpdate?.isEnabled) {
      setInterval(() => this.#swUpdate!.checkForUpdate(), 6 * 60 * 60 * 1000);
    }
  }

  /** Show native install prompt. Returns true if accepted. */
  async promptInstall(): Promise<boolean> {
    const prompt = this.#installPrompt();
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') this.#installPrompt.set(null);
    return outcome === 'accepted';
  }

  /** Apply pending SW update — reloads the page. */
  async applyUpdate(): Promise<void> {
    if (!this.#swUpdate?.isEnabled) return;
    await this.#swUpdate.activateUpdate();
    document.location.reload();
  }
}

// Extend EventTarget typings for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}
