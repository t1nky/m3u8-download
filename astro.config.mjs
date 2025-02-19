// @ts-check
import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Enable Solid to support Solid JSX components.
  integrations: [solid()],

  vite: {
    plugins: [tailwindcss()],
  },
});