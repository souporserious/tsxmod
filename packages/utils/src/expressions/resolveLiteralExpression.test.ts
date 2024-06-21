import { Project, SyntaxKind } from 'ts-morph'
import { resolveLiteralExpression } from './resolveExpressions'

describe('resolveLiteralExpression', () => {
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

    expect(resolveLiteralExpression(nullLiteral!)).toBeNull()
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

    expect(resolveLiteralExpression(trueLiteral!)).toBe(true)
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

    expect(resolveLiteralExpression(numericLiteral!)).toBe(123)
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

    expect(resolveLiteralExpression(stringLiteral!)).toBe('test')
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

    expect(resolveLiteralExpression(objectLiteral!)).toEqual({
      property: 'test',
    })
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

    expect(resolveLiteralExpression(arrayLiteral!)).toEqual([1, 2, 3])
  })

  it('resolve identifiers', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const test = 123; const anotherTest = test;',
      { overwrite: true }
    )
    const identifier = sourceFile
      .getVariableDeclaration('anotherTest')!
      .getInitializer()!

    expect(resolveLiteralExpression(identifier)).toBe(123)
  })

  it('resolves identifiers across files', () => {
    project.createSourceFile('foo.ts', 'export const foo = 123;', {
      overwrite: true,
    })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { foo } from './foo.ts'; const anotherTest = foo;`,
      { overwrite: true }
    )
    const identifier = sourceFile
      .getVariableDeclaration('anotherTest')!
      .getInitializer()!

    expect(resolveLiteralExpression(identifier)).toBe(123)
  })

  it('resolve as const values', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const test = 123 as const;',
      { overwrite: true }
    )
    const identifier = sourceFile
      .getVariableDeclaration('test')!
      .getInitializer()!

    expect(resolveLiteralExpression(identifier)).toBe(123)
  })
})
