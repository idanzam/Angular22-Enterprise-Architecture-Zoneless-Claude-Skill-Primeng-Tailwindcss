/**
 * Mission Control — Angular 22 application config
 * Zoneless (default) · OnPush (default) · PrimeNG 22 preset · Tailwind CSS layers
 *
 * Note what is ABSENT: provideZonelessChangeDetection (default since v21),
 * provideHttpClient(withFetch()) (fetch backend is the v22 default),
 * provideAnimationsAsync (PrimeNG 22 uses native CSS animations).
 */
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';

/** Deep-space preset: indigo primary, slate surfaces, shared radius token. */
const DeepSpace = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}', 100: '{indigo.100}', 200: '{indigo.200}',
      300: '{indigo.300}', 400: '{indigo.400}', 500: '{indigo.500}',
      600: '{indigo.600}', 700: '{indigo.700}', 800: '{indigo.800}',
      900: '{indigo.900}', 950: '{indigo.950}',
    },
    colorScheme: {
      dark: {
        surface: {
          0: '#ffffff', 50: '{slate.50}', 100: '{slate.100}', 200: '{slate.200}',
          300: '{slate.300}', 400: '{slate.400}', 500: '{slate.500}',
          600: '{slate.600}', 700: '{slate.700}', 800: '{slate.800}',
          900: '{slate.900}', 950: '{slate.950}',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding({ queryParams: true })),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: DeepSpace,
        options: {
          // Must match the Tailwind @custom-variant dark selector in styles.css
          darkModeSelector: '.dark',
          // Slot PrimeNG between Tailwind's base and utilities layers:
          // utilities always win over component styles — no !important, ever.
          cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
        },
      },
      // license: 'PRIMEUI-XXXX-XXXX',   // PrimeNG 22 commercial tier (offline check)
    }),
  ],
};
