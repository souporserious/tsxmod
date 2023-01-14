#!/usr/bin/env node
import { Project } from 'ts-morph'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { createWatcher } from './create-watcher'

const sourceFilePath = process.argv[2] || '.'
const watchFlag = process.argv[3] === '--watch'

const project = new Project({
  tsConfigFilePath: resolve(process.cwd(), sourceFilePath, 'tsconfig.json'),
})

const transformPath = `/Users/travisarnold/Code/tsxmod/packages/tsxmod/src/codemod.ts`

async function run() {
  const transform = await readFile(transformPath, 'utf8')
  const transformFn = new Function('project', transform)

  transformFn(project)

  project.save()
}

run()

if (watchFlag) {
  createWatcher(project, [transformPath], run)
}

export { project }
