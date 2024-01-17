import { Project, SyntaxKind } from 'ts-morph'
import { isJsxComponent } from './isJsxComponent'

describe('isJsxFunctionComponent', () => {
  const project = new Project()

  it('should return true for a function component', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function Component() { return <div /> }`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    expect(isJsxComponent(functionDeclaration!)).toBe(true)
  })

  it('should return true for a function component with return type', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function Component(): JSX.Element { return <div /> }`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    expect(isJsxComponent(functionDeclaration!)).toBe(true)
  })

  it('should return true for a function expression', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const Component = function() { return <div /> }`,
      { overwrite: true }
    )
    const functionExpression = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionExpression
    )
    expect(isJsxComponent(functionExpression!)).toBe(true)
  })

  it('should return true for an arrow function component', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const Component = () => <div />`,
      { overwrite: true }
    )
    const arrowFunction = sourceFile.getFirstDescendantByKind(
      SyntaxKind.ArrowFunction
    )
    expect(isJsxComponent(arrowFunction!)).toBe(true)
  })
})
