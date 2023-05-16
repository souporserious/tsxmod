#!/usr/bin/env node
import { Project } from 'ts-morph'
import { resolve } from 'node:path'
import { register } from 'esbuild-register/dist/node'
import { createWatcher } from './create-watcher'

// Transpile imported files with esbuild
register({ sourcemap: 'inline', target: 'es2022' })

const sourceFilePath = resolve(process.cwd(), process.argv[2] || '.')
const transformFilePath = resolve(sourceFilePath, '.tsxmod/mod.ts')
const tsConfigFilePath = resolve(sourceFilePath, 'tsconfig.json')
const watchFlag = process.argv[3] === '--watch'

console.log(
  `Analyzing project at: ${tsConfigFilePath.replace(process.cwd(), '')}`
)

const project = new Project({ tsConfigFilePath })
const isSaving = { current: false }

async function run() {
  console.clear()
  console.log(
    `Running transform at: ${transformFilePath.replace(process.cwd(), '')}`
  )

  const transformFn = require(transformFilePath).default

  try {
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

  isSaving.current = true

  project.save()

  isSaving.current = false
}

run()

if (watchFlag) {
  createWatcher(project, [transformFilePath], isSaving, run)
}

export { project }
