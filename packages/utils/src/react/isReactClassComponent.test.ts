import { Project, SyntaxKind } from 'ts-morph'
import { isReactClassComponent } from './isReactClassComponent'

describe('isReactClassComponent', () => {
  const project = new Project()

  it('should return true for a React class component', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `class Component extends React.Component { render() { return <div /> } }`,
      { overwrite: true }
    )
    const classDeclaration = sourceFile.getClassOrThrow('Component')
    expect(isReactClassComponent(classDeclaration)).toBe(true)
  })

  it('should return true for a React class component with React.PureComponent', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `class Component extends React.PureComponent { render() { return <div /> } }`,
      { overwrite: true }
    )
    const classDeclaration = sourceFile.getClassOrThrow('Component')
    expect(isReactClassComponent(classDeclaration)).toBe(true)
  })

  it('should return true for a React class component with Component', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { Component } from 'react'\nclass ReactComponent extends Component { render() { return <div /> } }`,
      { overwrite: true }
    )
    const classDeclaration = sourceFile.getClassOrThrow('ReactComponent')
    expect(isReactClassComponent(classDeclaration)).toBe(true)
  })

  it('should return false for a class that does not extend React.Component', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `class Component { render() { return <div /> } }`,
      { overwrite: true }
    )
    const classDeclaration = sourceFile.getClassOrThrow('Component')
    expect(isReactClassComponent(classDeclaration)).toBe(false)
  })
})
