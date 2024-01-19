import { Project, SyntaxKind } from 'ts-morph'
import { getDefaultValuesFromProperties } from './getDefaultValuesFromProperties'

describe('getDefaultValuesFromProperties', () => {
  const project = new Project()

  test('should parse a set of properties', () => {
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
      initialCount: '0',
      options: '{ incrementBy: 1 }',
    })
  })
})
