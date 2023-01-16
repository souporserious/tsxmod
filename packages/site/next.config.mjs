import { readFile, writeFile } from 'fs/promises'

export default async function () {
  writeFile(
    'public/tsxmod-utils.d.ts',
    await readFile('../utils/dist/index.d.ts', 'utf8')
  )

  return {
    experimental: {
      appDir: true,
    },
  }
}
