import { Project, SyntaxKind } from 'ts-morph'
import { isReactComponent } from './isReactComponent'

describe('isReactComponent', () => {
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
    expect(isReactComponent(functionDeclaration!)).toBe(true)
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
    expect(isReactComponent(functionDeclaration!)).toBe(true)
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
    expect(isReactComponent(arrowFunction!)).toBe(true)
  })

  it('should return true for a class component', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `class Component extends React.Component {}`,
      { overwrite: true }
    )
    const classDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.ClassDeclaration
    )
    expect(isReactComponent(classDeclaration!)).toBe(true)
  })
})
