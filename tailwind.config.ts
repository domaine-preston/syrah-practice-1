import DomaineTWExtend from '@meetdomaine/tailwind-syrah'
import path from 'node:path'
import type { Config } from 'tailwindcss'

export default {
  content: [
    './{layout,sections,snippets,templates,src}/**/*.{ts,js,jsx,tsx,json,liquid,css}',
    '!./{layout,sections,snippets,templates,src}/**/*styleguide.{liquid,css}',
  ],
  plugins: [
    require('tailwind-scrollbar'),
    require('@tailwindcss/container-queries'), // Support for container queries https://github.com/tailwindlabs/tailwindcss-container-queries
    DomaineTWExtend({
      manifestFilePath: path.resolve('./design.manifest.json'),
      fontMapping: {
        'PP Editorial New': 'Primary',
        'Maison Neue': 'Secondary',
        'NB Akademie Std': 'Tertiary',
        Inter: 'Quaternary',
      },
      // fluidTypography: false,  // Disable fluid typography
      /*
      Provide custom font weight mapping if needed, the value is matched fontName.style from design manifest
        fontWeightMapping: {
          Primary: {
            'Light Italic': 300,
            Regular: 700,
          },
        },
      */
      // fontWeightMapping: {
      //   Primary: {
      //     Regular: 700,
      //   },
      // },
    }),
  ],
} satisfies Config
