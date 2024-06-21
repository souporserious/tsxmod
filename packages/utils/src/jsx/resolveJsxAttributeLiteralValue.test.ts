import { Project, SyntaxKind } from 'ts-morph'
import { resolveJsxAttributeLiteralValue } from './resolveJsxAttributeLiteralValue'

describe('resolveJsxAttributeLiteralValue', () => {
  const project = new Project()

  it('should correctly resolve string literals', () => {
    const sourceFile = project.createSourceFile(
      'test.tsx',
      'const test = 123; const anotherTest = test; const jsx = <div prop={anotherTest}></div>;',
      { overwrite: true }
    )
    const jsxAttribute = sourceFile.getFirstDescendantByKind(
      SyntaxKind.JsxAttribute
    )!

    expect(resolveJsxAttributeLiteralValue(jsxAttribute!)).toBe(123)
  })
})
