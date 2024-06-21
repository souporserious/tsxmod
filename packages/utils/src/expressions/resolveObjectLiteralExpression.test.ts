import { Project, SyntaxKind } from 'ts-morph'
import { resolveObjectLiteralExpression } from './resolveObjectLiteralExpression'

describe('resolveObject', () => {
  it('should correctly resolve property assignments', () => {
    const project = new Project()
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const object = { property: "test" };'
    )
    const objectLiteral = sourceFile.getFirstDescendantByKind(
      SyntaxKind.ObjectLiteralExpression
    )
    const object = resolveObjectLiteralExpression(objectLiteral!)

    expect(object).toEqual({ property: 'test' })
  })

  it('should correctly resolve spread assignments', () => {
    const project = new Project()
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const spread = { spread: "test" };\nconst object = { ...spread };'
    )
    const objectLiteral = sourceFile.getFirstDescendantByKind(
      SyntaxKind.ObjectLiteralExpression
    )
    const object = resolveObjectLiteralExpression(objectLiteral!)

    expect(object).toEqual({ spread: 'test' })
  })

  it('should correctly resolve spread assignments without identifier', () => {
    const project = new Project()
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const object = { ...{ spread: "test" } };'
    )
    const objectLiteral = sourceFile.getFirstDescendantByKind(
      SyntaxKind.ObjectLiteralExpression
    )
    const object = resolveObjectLiteralExpression(objectLiteral!)

    expect(object).toEqual({ spread: 'test' })
  })
})
