#!/usr/bin/env node
import { Project } from 'ts-morph'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { createWatcher } from './create-watcher'
import { transformCode } from './transform-code'

const sourceFilePath = resolve(process.cwd(), process.argv[2] || '.')
const transformFilePath = resolve(sourceFilePath, '.tsxmod/mod.ts')
const watchFlag = process.argv[3] === '--watch'

const project = new Project({
  tsConfigFilePath: resolve(sourceFilePath, 'tsconfig.json'),
})

async function run() {
  const transform = await readFile(transformFilePath, 'utf8')
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

  project.save()
}

run()

if (watchFlag) {
  createWatcher(project, [transformFilePath], run)
}

export { project }
