import { readFileSync } from 'fs'
import { Project, SyntaxKind } from 'ts-morph'
import { findReferencesAsJsxElements } from './findReferencesAsJsxElements'

const buttonSource = readFileSync('fixtures/app/Button.tsx', 'utf8')
const dialogSource = readFileSync('fixtures/app/Dialog.tsx', 'utf8')
const appSource = readFileSync('fixtures/app/App.tsx', 'utf8')

test('finds all element references to a component', () => {
  const project = new Project({ useInMemoryFileSystem: true })

  const buttonSourceFile = project.createSourceFile('Button.tsx', buttonSource)

  project.createSourceFile('Dialog.tsx', dialogSource)
  project.createSourceFile('App.tsx', appSource)

  const componentIdentifier = buttonSourceFile
    .getVariableDeclarationOrThrow('Button')
    .getFirstDescendantByKindOrThrow(SyntaxKind.Identifier)
  const references = findReferencesAsJsxElements(componentIdentifier)

  expect(references.map((reference) => reference.getText())).toMatchSnapshot()
})
