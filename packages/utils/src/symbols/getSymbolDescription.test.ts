import { Project, SyntaxKind } from 'ts-morph'
import { getSymbolDescription } from './getSymbolDescription'

describe('getSymbolDescription', () => {
  const project = new Project()

  test('should parse a symbol with jsdocs', () => {
    const description = 'Provides the initial count.'
    const sourceFile = project.createSourceFile(
      'test.ts',
      `/** ${description} */\nconst initialCount = 0`,
      { overwrite: true }
    )
    const symbol = sourceFile
      .getFirstDescendantByKind(SyntaxKind.VariableDeclaration)!
      .getSymbol()!

    expect(getSymbolDescription(symbol)).toEqual(description)
  })

  test('should parse a symbol with a leading comment', () => {
    const description = 'Provides the initial count.'
    const sourceFile = project.createSourceFile(
      'test.ts',
      `// ${description}\nconst initialCount = 0`,
      { overwrite: true }
    )
    const symbol = sourceFile
      .getFirstDescendantByKind(SyntaxKind.VariableDeclaration)!
      .getSymbol()!

    expect(getSymbolDescription(symbol)).toEqual(description)
  })
})
