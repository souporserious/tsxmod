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

  it('returns a variable declaration initializer', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const Component = () => <div />`,
      { overwrite: true }
    )
    const variableDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.VariableDeclaration
    )
    const result = getReactFunctionDeclaration(variableDeclaration!)
    const initializer = variableDeclaration?.getInitializer()
    expect(result).toBe(initializer)
  })

  it('handles forwardRef correctly', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { forwardRef } from 'react'\nconst Component = forwardRef((props, ref) => <div ref={ref} {...props} />)`,
      { overwrite: true }
    )
    const variableDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.VariableDeclaration
    )
    const result = getReactFunctionDeclaration(variableDeclaration!)!
    expect(result.getKind()).toBe(SyntaxKind.ArrowFunction)
  })

  it('handles React.forwardRef correctly', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import * as React from 'react'\nconst Component = React.forwardRef(function Component (props, ref) { return <div ref={ref} {...props} /> })`,
      { overwrite: true }
    )
    const variableDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.VariableDeclaration
    )
    const result = getReactFunctionDeclaration(variableDeclaration!)!
    expect(result.getKind()).toBe(SyntaxKind.FunctionExpression)
  })

  it('returns null for non-component declarations', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const nonComponent = 123;`,
      { overwrite: true }
    )
    const variableDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.VariableDeclaration
    )
    const result = getReactFunctionDeclaration(variableDeclaration!)
    expect(result).toBeNull()
  })
})
