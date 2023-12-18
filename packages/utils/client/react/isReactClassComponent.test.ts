import { Project, SyntaxKind } from 'ts-morph'
import { isReactClassComponent } from './isReactClassComponent'

describe('isReactClassComponent', () => {
  const project = new Project()

  it('should return true for a class component', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `class Component extends React.Component {}`,
      { overwrite: true }
    )
    const classDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.ClassDeclaration
    )
    expect(isReactClassComponent(classDeclaration!)).toBe(true)
  })

  it('should return false for a non-react class component', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `class Component {}`,
      { overwrite: true }
    )
    const classDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.ClassDeclaration
    )
    expect(isReactClassComponent(classDeclaration!)).toBe(false)
  })
})
