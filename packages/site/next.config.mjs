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
  }
}
