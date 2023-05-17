import { readFileSync } from 'fs'
import { Project } from 'ts-morph'
import { findRootComponentReferences } from './findRootComponentReferences'

const buttonSource = readFileSync('fixtures/app/Button.tsx', 'utf8')
const dialogSource = readFileSync('fixtures/app/Dialog.tsx', 'utf8')

const pageSource = `
import React from 'react'
import { Dialog } from './Dialog'

export default function Page() {
    return <div><Dialog /></div>
}
`

test('traces component references to the root element', () => {
  const project = new Project({ useInMemoryFileSystem: true })

  const buttonSourceFile = project.createSourceFile('Button.tsx', buttonSource)

  project.createSourceFile('Dialog.tsx', dialogSource)
  project.createSourceFile('about.tsx', pageSource)
  project.createSourceFile('contact.tsx', pageSource)

  const component = buttonSourceFile.getVariableDeclarationOrThrow('Button')
  const references = findRootComponentReferences(component)

  expect(
    references.map((node) => node.getSourceFile().getFilePath())
  ).toMatchSnapshot()
})
