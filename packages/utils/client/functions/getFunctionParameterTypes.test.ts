import { Project, SyntaxKind } from 'ts-morph'
import { getFunctionParameterTypes } from './getFunctionParameterTypes'

describe('getFunctionParameterTypes', () => {
  const project = new Project()

  it('should parse a function with parameters', () => {
    const description = 'Provides the initial count.'
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function useCounter(\n/** ${description} */ initialCount: number = 0) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: 'initialCount',
      text: 'number',
      defaultValue: '0',
      required: false,
      properties: null,
      description,
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
      text: '{ initialCount?: number; }',
      defaultValue: undefined,
      required: true,
      description: null,
      properties: [
        {
          name: 'initialCount',
          text: 'number',
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
      text: '{ initial?: {    count: number;}; }',
      defaultValue: '{}',
      required: false,
      description: null,
      properties: [
        {
          name: 'initial',
          text: '{ count: number }',
          defaultValue: '{ count: 0 }',
          required: false,
          properties: [
            {
              name: 'count',
              text: 'number',
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

  it('should parse arrow function parameters', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const useCounter = (initialCount: number = 0) => {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.ArrowFunction
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: 'initialCount',
      text: 'number',
      defaultValue: '0',
      required: false,
      properties: null,
      description: null,
    })
  })

  it('should parse function expression parameters', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const useCounter = function (initialCount: number = 0) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionExpression
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: 'initialCount',
      text: 'number',
      defaultValue: '0',
      required: false,
      properties: null,
      description: null,
    })
  })

  test('imported type should not be parsed', () => {
    project.createSourceFile(
      'types.ts',
      `export type CounterOptions = { initialCount?: number }`
    )
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { CounterOptions } from './types' function useCounter({ initialCount = 0 }: CounterOptions) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: null,
      text: 'CounterOptions',
      defaultValue: undefined,
      required: true,
      properties: null,
      description: null,
    })
  })

  test('imported function return types should not be parsed', () => {
    project.createSourceFile(
      'types.ts',
      `export function useCounter() { return { initialCount: 0 } }`,
      { overwrite: true }
    )
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { useCounter } from './types' function useCounterOverride({ initialCount = 0 }: ReturnType<typeof useCounter>) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: null,
      text: 'ReturnType<typeof useCounter>',
      defaultValue: undefined,
      required: true,
      properties: null,
      description: null,
    })
  })

  test('imported function object return types should not be parsed', () => {
    project.createSourceFile(
      'types.ts',
      `export function useCounter() { return { initialCount: 0 } }`,
      { overwrite: true }
    )
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { useCounter } from './types' function useCounterOverride({ counterState }: { counterState: ReturnType<typeof useCounter> }) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: null,
      text: '{ counterState: ReturnType<typeof useCounter>; }',
      defaultValue: undefined,
      required: true,
      properties: [
        {
          name: 'counterState',
          text: 'ReturnType<typeof useCounter>',
          defaultValue: undefined,
          required: true,
          properties: null,
          description: null,
        },
      ],
      description: null,
    })
  })

  test('handles union types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `type BaseProps = { color: string }; type Props = BaseProps & { source: string } | BaseProps & { value: string }; function Component(props: Props) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: 'props',
      text: 'Props',
      defaultValue: undefined,
      required: true,
      properties: [
        {
          name: 'color',
          text: 'string',
          defaultValue: undefined,
          properties: null,
          required: true,
          description: null,
        },
      ],
      unionProperties: [
        [
          {
            defaultValue: undefined,
            description: null,
            name: 'source',
            properties: null,
            required: true,
            text: 'string',
          },
        ],
        [
          {
            defaultValue: undefined,
            description: null,
            name: 'value',
            properties: null,
            required: true,
            text: 'string',
          },
        ],
      ],
      description: null,
    })
  })

  test('handles union types with primitive types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `type Props = { color: string } | string; function Component(props: Props) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: 'props',
      text: 'Props',
      defaultValue: undefined,
      required: true,
      properties: [],
      unionProperties: [
        [
          {
            defaultValue: undefined,
            description: null,
            name: null,
            properties: null,
            required: true,
            text: 'string',
          },
        ],
        [
          {
            name: 'color',
            text: 'string',
            defaultValue: undefined,
            properties: null,
            required: true,
            description: null,
          },
        ],
      ],
      description: null,
    })
  })

  test('handles union types with external types', () => {
    project.createSourceFile(
      'types.ts',
      `export type BaseProps = { color: string }`,
      { overwrite: true }
    )
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { BaseProps } from './types'; type Props = BaseProps & { source: string } | BaseProps & { value: string }; function Component(props: Props) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKind(
      SyntaxKind.FunctionDeclaration
    )
    const types = getFunctionParameterTypes(functionDeclaration!)
    const [type] = types!

    expect(type).toEqual({
      name: 'props',
      text: 'Props',
      defaultValue: undefined,
      required: true,
      properties: [
        {
          name: null,
          text: 'BaseProps',
          defaultValue: undefined,
          required: true,
          properties: null,
          description: null,
        },
      ],
      unionProperties: [
        [
          {
            defaultValue: undefined,
            description: null,
            name: 'source',
            properties: null,
            required: true,
            text: 'string',
          },
        ],
        [
          {
            defaultValue: undefined,
            description: null,
            name: 'value',
            properties: null,
            required: true,
            text: 'string',
          },
        ],
      ],
      description: null,
    })
  })
})
