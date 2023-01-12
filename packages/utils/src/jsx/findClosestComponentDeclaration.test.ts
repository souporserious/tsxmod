import { readFileSync } from 'fs'
import { Project, SyntaxKind } from 'ts-morph'
import { findClosestComponentDeclaration } from './findClosestComponentDeclaration'

const buttonSource = readFileSync('fixtures/app/Button.tsx', 'utf8')
const dialogSource = readFileSync('fixtures/app/Dialog.tsx', 'utf8')
const appSource = readFileSync('fixtures/app/App.tsx', 'utf8')

test('finds the closest component to a node', () => {
  const project = new Project({ useInMemoryFileSystem: true })

  const buttonSourceFile = project.createSourceFile('Button.tsx', buttonSource)
  const buttonJsxElementIdentifier = buttonSourceFile.getFirstDescendantOrThrow(
    (node) => node.getText() === 'button'
  )

  expect(
    findClosestComponentDeclaration(buttonJsxElementIdentifier)!.getText()
  ).toMatchSnapshot()

  const dialogSourceFile = project.createSourceFile('Dialog.tsx', dialogSource)
  const dialogJsxElementIdentifier = dialogSourceFile.getFirstDescendantOrThrow(
    (node) => node.getText() === 'dialog'
  )

  expect(
    findClosestComponentDeclaration(dialogJsxElementIdentifier)!.getText()
  ).toMatchSnapshot()

  const appSourceFile = project.createSourceFile('App.tsx', appSource)
  const searchLine = 10 // <Button />

  for (const node of appSourceFile.getStatements()) {
    const startLine = node.getStartLineNumber()
    const endLine = node.getEndLineNumber()

    if (searchLine >= startLine && searchLine <= endLine) {
      const identifier = node.getFirstDescendantByKindOrThrow(
        SyntaxKind.Identifier
      )

      expect(
        findClosestComponentDeclaration(identifier)!.getText()
      ).toMatchSnapshot()
    }
  }
})
