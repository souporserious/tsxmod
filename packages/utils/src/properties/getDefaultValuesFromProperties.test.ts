import { Project, SyntaxKind } from 'ts-morph'
import { getDefaultValuesFromProperties } from './getDefaultValuesFromProperties'

describe('getDefaultValuesFromProperties', () => {
  const project = new Project()

  test('parses a set of properties', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const createCounter = (initialCount = 0, options: { incrementBy: number } = { incrementBy: 1 }) => {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.ArrowFunction
    )
    const defaultValues = getDefaultValuesFromProperties(
      functionDeclaration.getParameters()
    )
    expect(defaultValues).toEqual({
      initialCount: 0,
      options: { incrementBy: 1 },
    })
  })

  test('renamed property default values', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function useCounter({ initialCount: renamedInitialCount = 0 }: { initialCount: number }) {}`,
      { overwrite: true }
    )
    const [parameter] = sourceFile
      .getFunctionOrThrow('useCounter')
      .getParameters()
    const types = getDefaultValuesFromProperties(
      parameter.getDescendantsOfKind(SyntaxKind.BindingElement)
    )

    expect(types).toEqual({
      initialCount: 0,
    })
  })

  test('template string default values', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      'const a = 1; const b = 2; const createCounter = (initialCount = `${a + b}`) => {}',
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.ArrowFunction
    )
    const defaultValues = getDefaultValuesFromProperties(
      functionDeclaration.getParameters()
    )
    expect(defaultValues).toEqual({
      initialCount: '3',
    })
  })

  test('function default values', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const createCounter = (initialCount = () => 0) => {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.ArrowFunction
    )
    const defaultValues = getDefaultValuesFromProperties(
      functionDeclaration.getParameters()
    )
    expect(defaultValues).toEqual({
      initialCount: '() => 0',
    })
  })
})
