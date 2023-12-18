import { Project, SyntaxKind } from 'ts-morph'
import { isForwardRefExpression } from './isForwardRefExpression'

describe('isForwardRefExpression', () => {
  const project = new Project()

  it('should return true for a forwardRef expression', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const Component = forwardRef(() => <div />)`,
      { overwrite: true }
    )
    const variableDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.VariableDeclaration
    )
    const initializer = variableDeclaration!.getInitializer()
    expect(isForwardRefExpression(initializer)).toBe(true)
  })

  it('should return true for a React.forwardRef expression', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const Component = React.forwardRef(() => <div />)`,
      { overwrite: true }
    )
    const variableDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.VariableDeclaration
    )
    const initializer = variableDeclaration!.getInitializer()
    expect(isForwardRefExpression(initializer)).toBe(true)
  })
})
