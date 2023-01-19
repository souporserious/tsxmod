#!/usr/bin/env node
import { Project } from 'ts-morph'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { createWatcher } from './create-watcher'
import { transformCode } from './transform-code'

const sourceFilePath = resolve(process.cwd(), process.argv[2] || '.')
const transformFilePath = resolve(sourceFilePath, '.tsxmod/mod.ts')
const tsConfigFilePath = resolve(sourceFilePath, 'tsconfig.json')
const watchFlag = process.argv[3] === '--watch'

console.log(
  `Analyzing project at: ${tsConfigFilePath.replace(process.cwd(), '')}`
)

const project = new Project({ tsConfigFilePath })

async function run() {
  console.clear()

  const transform = await readFile(transformFilePath, 'utf8')

  try {
    const transformFn = new Function(
      'exports',
      'require',
      await transformCode(transform)
    )
    const exports = { default: undefined }

    transformFn(exports, require)

    try {
      exports.default(project)
    } catch (error) {
      console.error(error)
    }
  } catch (error) {
    console.error(error)
  }

  project.save()
}

run()

if (watchFlag) {
  createWatcher(project, [transformFilePath], run)
}

export { project }
