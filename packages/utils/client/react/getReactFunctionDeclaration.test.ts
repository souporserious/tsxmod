import { Project, SyntaxKind } from 'ts-morph'
import { getReactFunctionDeclaration } from './getReactFunctionDeclaration'

describe('getReactFunctionDeclaration', () => {
  const project = new Project()

  it('returns a function declaration', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function Component() { return <div /> }`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    expect(getReactFunctionDeclaration(functionDeclaration!)).toBe(
      functionDeclaration
    )
  })

  it('returns a variable declaration', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const Component = () => <div />`,
      { overwrite: true }
    )
    const variableDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.VariableDeclaration
    )
    expect(getReactFunctionDeclaration(variableDeclaration!)).toBe(
      variableDeclaration
    )
  })
})
