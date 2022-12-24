#!/usr/bin/env node
import { Project } from 'ts-morph'
import { resolve } from 'node:path'

const sourceFilePath = process.argv[2] || '.'

const project = new Project({
  tsConfigFilePath: resolve(process.cwd(), sourceFilePath, 'tsconfig.json'),
})

export { project }
