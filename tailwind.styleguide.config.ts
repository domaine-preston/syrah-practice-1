import baseConfig from './tailwind.config'

// Extend the base config to map only files with styleguide in them snippets
baseConfig.content = baseConfig.content.filter(
  (file) => !file.includes('styleguide')
)

export default baseConfig
