import { Project, SyntaxKind } from 'ts-morph'
import { resolveExpression } from '../expressions/resolveExpression'

describe('resolveExpression', () => {
  const project = new Project()

  it('should correctly resolve null literals', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const test = null;',
      { overwrite: true }
    )
    const nullLiteral = sourceFile.getFirstDescendantByKind(
      SyntaxKind.NullKeyword
    )

    expect(resolveExpression(nullLiteral!)).toBeNull()
  })

  it('should correctly resolve boolean literals', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const test = true;',
      { overwrite: true }
    )
    const trueLiteral = sourceFile.getFirstDescendantByKind(
      SyntaxKind.TrueKeyword
    )

    expect(resolveExpression(trueLiteral!)).toBe(true)
  })

  it('should correctly resolve numeric literals', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const test = 123;',
      { overwrite: true }
    )
    const numericLiteral = sourceFile.getFirstDescendantByKind(
      SyntaxKind.NumericLiteral
    )

    expect(resolveExpression(numericLiteral!)).toBe(123)
  })

  it('should correctly resolve string literals', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const test = "test";',
      { overwrite: true }
    )
    const stringLiteral = sourceFile.getFirstDescendantByKind(
      SyntaxKind.StringLiteral
    )

    expect(resolveExpression(stringLiteral!)).toBe('test')
  })

  it('should correctly resolve object literal expressions', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const test = { property: "test" };',
      { overwrite: true }
    )
    const objectLiteral = sourceFile.getFirstDescendantByKind(
      SyntaxKind.ObjectLiteralExpression
    )

    expect(resolveExpression(objectLiteral!)).toEqual({ property: 'test' })
  })

  it('should correctly resolve array literal expressions', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const test = [1, 2, 3];',
      { overwrite: true }
    )
    const arrayLiteral = sourceFile.getFirstDescendantByKind(
      SyntaxKind.ArrayLiteralExpression
    )

    expect(resolveExpression(arrayLiteral!)).toEqual([1, 2, 3])
  })

  it('should correctly resolve identifiers', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const test = 123; const anotherTest = test;',
      { overwrite: true }
    )
    const identifier = sourceFile
      .getVariableDeclaration('anotherTest')!
      .getInitializer()!

    expect(resolveExpression(identifier)).toBe(123)
  })
})
