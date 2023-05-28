import { Project, SyntaxKind } from 'ts-morph'
import { resolveJsxAttributeValue } from './resolveJsxAttributeValue'

describe('resolveJsxAttributeValue', () => {
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

    expect(resolveJsxAttributeValue(jsxAttribute!)).toBe(123)
  })
})
