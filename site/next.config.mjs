import webpack from 'webpack'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default async function () {
  try {
    writeFile(
      'public/tsxmod-utils.d.ts',
      await readFile(
        resolve(process.cwd(), '../packages/utils/dist/index.d.ts'),
        'utf8'
      )
    )
  } catch (error) {
    console.error(error)
  }

  return {
    webpack: (config) => {
      config.plugins.push(
        // silence ts-morph warnings
        new webpack.ContextReplacementPlugin(
          /\/@ts-morph\/common\//,
          (data) => {
            for (const dependency of data.dependencies) {
              delete dependency.critical
            }
            return data
          }
        )
      )

      return config
    },
  }
}
