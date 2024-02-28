import { Project, SyntaxKind } from 'ts-morph'
import { hasJsDocTag } from './hasJsDocTag'

describe('hasJsDocTag', () => {
  const project = new Project()

  test('function declaration', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `/** @internal */\nfunction Component() { return <div /> }`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    expect(hasJsDocTag(functionDeclaration, 'internal')).toBe(true)
  })

  test('exported variable declaration', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `/** @internal */\nexport const Component = () => <div />`,
      { overwrite: true }
    )
    const variableDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.VariableDeclaration
    )
    expect(hasJsDocTag(variableDeclaration, 'internal')).toBe(true)
  })
})
