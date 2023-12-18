import { Project, SyntaxKind } from 'ts-morph'
import { getFunctionParameterTypes } from './getFunctionParameterTypes'

describe('getFunctionParameterTypes', () => {
  const project = new Project()

  it('should parse a function with parameters', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function useCounter(initialCount: number = 0) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: 'initialCount',
      type: 'number',
      defaultValue: '0',
      required: false,
      description: null,
      properties: [],
    })
  })

  it('should parse a function with an object parameter', () => {
    const description = 'Provides the initial count.'
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function useCounter({ initialCount = 0 }: {\n/** ${description} */ initialCount?: number }) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: null,
      type: '{ initialCount?: number; }',
      defaultValue: undefined,
      required: true,
      description: null,
      properties: [
        {
          name: 'initialCount',
          type: 'number',
          defaultValue: '0',
          required: false,
          properties: null,
          description,
        },
      ],
    })
  })

  it('should parse a function with an object parameter with a nested object', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function useCounter({ initial = { count: 0 } }?: { initial?: { count: number } } = {}) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: null,
      type: '{ initial?: {    count: number;}; }',
      defaultValue: '{}',
      required: false,
      description: null,
      properties: [
        {
          name: 'initial',
          type: '{ count: number; }',
          defaultValue: '{ count: 0 }',
          required: false,
          properties: [
            {
              name: 'count',
              type: 'number',
              defaultValue: undefined,
              required: true,
              properties: null,
              description: null,
            },
          ],
          description: null,
        },
      ],
    })
  })
})
