import syrahPlugin from '@meetdomaine/vite-plugin-project-syrah'
import VitePluginSvgSpritemap from '@spiriit/vite-plugin-svg-spritemap'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    syrahPlugin({
      cwd: __dirname,
    }),
    VitePluginSvgSpritemap('./src/icons/*.svg', {
      prefix: false,
      output: {
        filename: 'icons.svg',
        use: false,
        view: false,
      },
    }),
  ],
})
