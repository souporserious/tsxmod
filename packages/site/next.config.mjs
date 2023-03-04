import FilterWarningsPlugin from 'webpack-filter-warnings-plugin'
import { readFile, writeFile } from 'fs/promises'

export default async function () {
  try {
    writeFile(
      'public/tsxmod-utils.d.ts',
      await readFile('../utils/dist/index.d.ts', 'utf8')
    )
  } catch (error) {
    console.error(error)
  }

  return {
    experimental: {
      appDir: true,
    },
    webpack: (config, options) => {
      config.plugins.push(
        // TODO: #8 silencing ts-morph critical dependency warnings for now
        new FilterWarningsPlugin({
          exclude: [
            /Critical dependency: the request of a dependency is an expression/,
          ],
        })
      )

      return config
    },
  }
}
