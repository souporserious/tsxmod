import dedent from 'dedent'
import {
  Project,
  SyntaxKind,
  type ClassDeclaration,
  type FunctionDeclaration,
} from 'ts-morph'
import { getTypeDocumentation } from './getTypeDocumentation'

describe('getTypeDocumentation', () => {
  const project = new Project()

  test('parses a function with parameters', () => {
    const description = 'Provides the initial count.'
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function useCounter(\n/** ${description} */ initialCount: number = 0) {}`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('useCounter')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "useCounter",
        "position": {
          "end": {
            "column": 64,
            "line": 2,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": 0,
                "description": "Provides the initial count.",
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Number",
                "name": "initialCount",
                "position": {
                  "end": {
                    "column": 60,
                    "line": 2,
                  },
                  "start": {
                    "column": 36,
                    "line": 2,
                  },
                },
                "type": "number",
                "value": undefined,
              },
            ],
            "returnType": "void",
            "type": "function useCounter(initialCount: number): void",
          },
        ],
        "type": "(initialCount?: number) => void",
      }
    `)
  })

  test('parses a function with an object parameter', () => {
    const description = 'Provides the initial count.'
    const sourceFile = project.createSourceFile(
      'test.ts',
      `/** Provides a counter state. \n* @deprecated use \`Counter\` component\n */\nfunction useCounter({ initialCount = 0 }: {\n/** ${description} */ initialCount?: number }) {}`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('useCounter')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "description": "Provides a counter state. ",
        "filePath": "test.ts",
        "kind": "Function",
        "name": "useCounter",
        "position": {
          "end": {
            "column": 63,
            "line": 5,
          },
          "start": {
            "column": 1,
            "line": 4,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": {
                  "initialCount": 0,
                },
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Object",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 59,
                    "line": 5,
                  },
                  "start": {
                    "column": 21,
                    "line": 4,
                  },
                },
                "properties": [
                  {
                    "defaultValue": 0,
                    "description": "Provides the initial count.",
                    "filePath": "test.ts",
                    "isOptional": true,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "initialCount",
                    "position": {
                      "end": {
                        "column": 57,
                        "line": 5,
                      },
                      "start": {
                        "column": 36,
                        "line": 5,
                      },
                    },
                    "tags": undefined,
                    "type": "number",
                    "value": undefined,
                  },
                ],
                "type": "{ initialCount?: number; }",
              },
            ],
            "returnType": "void",
            "type": "function useCounter({ initialCount?: number; }): void",
          },
        ],
        "tags": [
          {
            "tagName": "deprecated",
            "text": "use \`Counter\` component",
          },
        ],
        "type": "({ initialCount }: {    initialCount?: number;}) => void",
      }
    `)
  })

  test('parses a function with an object parameter with a nested object', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function useCounter({ initial = { count: 0 } }?: { initial?: { count: number } } = {}) {}`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('useCounter')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "useCounter",
        "position": {
          "end": {
            "column": 90,
            "line": 1,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": {
                  "initial": {
                    "count": 0,
                  },
                },
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": true,
                "kind": "Object",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 86,
                    "line": 1,
                  },
                  "start": {
                    "column": 21,
                    "line": 1,
                  },
                },
                "properties": [
                  {
                    "defaultValue": {
                      "count": 0,
                    },
                    "filePath": "test.ts",
                    "isOptional": true,
                    "isReadonly": false,
                    "kind": "Object",
                    "name": "initial",
                    "position": {
                      "end": {
                        "column": 79,
                        "line": 1,
                      },
                      "start": {
                        "column": 52,
                        "line": 1,
                      },
                    },
                    "properties": [
                      {
                        "defaultValue": 0,
                        "filePath": "test.ts",
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "Number",
                        "name": "count",
                        "position": {
                          "end": {
                            "column": 77,
                            "line": 1,
                          },
                          "start": {
                            "column": 64,
                            "line": 1,
                          },
                        },
                        "type": "number",
                        "value": undefined,
                      },
                    ],
                    "type": "{ count: number; }",
                  },
                ],
                "type": "{ initial?: {    count: number;}; }",
              },
            ],
            "returnType": "void",
            "type": "function useCounter({ initial?: {    count: number;}; }): void",
          },
        ],
        "type": "({ initial }?: {    initial?: {        count: number;    };}) => void",
      }
    `)
  })

  test('parses arrow function parameters', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const useCounter = (initialCount: number = 0) => {}`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('useCounter')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "useCounter",
        "position": {
          "end": {
            "column": 52,
            "line": 1,
          },
          "start": {
            "column": 7,
            "line": 1,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": 0,
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Number",
                "name": "initialCount",
                "position": {
                  "end": {
                    "column": 45,
                    "line": 1,
                  },
                  "start": {
                    "column": 21,
                    "line": 1,
                  },
                },
                "type": "number",
                "value": undefined,
              },
            ],
            "returnType": "void",
            "type": "(initialCount: number) => void",
          },
        ],
        "type": "(initialCount?: number) => void",
      }
    `)
  })

  test('parses function expression parameters', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `const useCounter = function (initialCount: number = 0) {}`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('useCounter')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "useCounter",
        "position": {
          "end": {
            "column": 58,
            "line": 1,
          },
          "start": {
            "column": 7,
            "line": 1,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": 0,
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Number",
                "name": "initialCount",
                "position": {
                  "end": {
                    "column": 54,
                    "line": 1,
                  },
                  "start": {
                    "column": 30,
                    "line": 1,
                  },
                },
                "type": "number",
                "value": undefined,
              },
            ],
            "returnType": "void",
            "type": "(initialCount: number) => void",
          },
        ],
        "type": "(initialCount?: number) => void",
      }
    `)
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
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('useCounter')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "useCounter",
        "position": {
          "end": {
            "column": 102,
            "line": 1,
          },
          "start": {
            "column": 42,
            "line": 1,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": {
                  "initialCount": 0,
                },
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Reference",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 98,
                    "line": 1,
                  },
                  "start": {
                    "column": 62,
                    "line": 1,
                  },
                },
                "type": "CounterOptions",
              },
            ],
            "returnType": "void",
            "type": "function useCounter(CounterOptions): void",
          },
        ],
        "type": "({ initialCount }: CounterOptions) => void",
      }
    `)
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
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('useCounterOverride')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "useCounterOverride",
        "position": {
          "end": {
            "column": 121,
            "line": 1,
          },
          "start": {
            "column": 38,
            "line": 1,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": {
                  "initialCount": 0,
                },
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Reference",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 117,
                    "line": 1,
                  },
                  "start": {
                    "column": 66,
                    "line": 1,
                  },
                },
                "type": "{ initialCount: number; }",
              },
            ],
            "returnType": "void",
            "type": "function useCounterOverride({ initialCount: number; }): void",
          },
        ],
        "type": "({ initialCount }: ReturnType<typeof useCounter>) => void",
      }
    `)
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
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('useCounterOverride')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "useCounterOverride",
        "position": {
          "end": {
            "column": 135,
            "line": 1,
          },
          "start": {
            "column": 38,
            "line": 1,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Object",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 131,
                    "line": 1,
                  },
                  "start": {
                    "column": 66,
                    "line": 1,
                  },
                },
                "properties": [
                  {
                    "arguments": [
                      {
                        "filePath": "types.ts",
                        "kind": "Reference",
                        "position": {
                          "end": {
                            "column": 60,
                            "line": 1,
                          },
                          "start": {
                            "column": 1,
                            "line": 1,
                          },
                        },
                        "type": "typeof useCounter",
                      },
                    ],
                    "defaultValue": undefined,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Generic",
                    "name": "counterState",
                    "position": {
                      "end": {
                        "column": 129,
                        "line": 1,
                      },
                      "start": {
                        "column": 86,
                        "line": 1,
                      },
                    },
                    "type": "ReturnType<typeof useCounter>",
                    "typeName": "ReturnType",
                  },
                ],
                "type": "{ counterState: ReturnType<typeof useCounter>; }",
              },
            ],
            "returnType": "void",
            "type": "function useCounterOverride({ counterState: ReturnType<typeof useCounter>; }): void",
          },
        ],
        "type": "({ counterState }: { counterState: ReturnType<typeof useCounter>; }) => void",
      }
    `)
  })

  test('union types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type BaseProps = { color: string };
      
      type Props = BaseProps & { source: string } | BaseProps & { value: string };
      
      function Component(props: Props) {}
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('Component')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Component",
        "name": "Component",
        "position": {
          "end": {
            "column": 36,
            "line": 5,
          },
          "start": {
            "column": 1,
            "line": 5,
          },
        },
        "signatures": [
          {
            "kind": "ComponentSignature",
            "modifier": undefined,
            "properties": {
              "defaultValue": undefined,
              "description": undefined,
              "filePath": "test.ts",
              "isOptional": false,
              "kind": "Union",
              "members": [
                {
                  "filePath": "test.ts",
                  "kind": "Object",
                  "name": undefined,
                  "position": {
                    "end": {
                      "column": 77,
                      "line": 3,
                    },
                    "start": {
                      "column": 1,
                      "line": 3,
                    },
                  },
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "color",
                      "position": {
                        "end": {
                          "column": 33,
                          "line": 1,
                        },
                        "start": {
                          "column": 20,
                          "line": 1,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "source",
                      "position": {
                        "end": {
                          "column": 42,
                          "line": 3,
                        },
                        "start": {
                          "column": 28,
                          "line": 3,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                  ],
                  "type": "BaseProps & { source: string; }",
                },
                {
                  "filePath": "test.ts",
                  "kind": "Object",
                  "name": undefined,
                  "position": {
                    "end": {
                      "column": 77,
                      "line": 3,
                    },
                    "start": {
                      "column": 1,
                      "line": 3,
                    },
                  },
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "color",
                      "position": {
                        "end": {
                          "column": 33,
                          "line": 1,
                        },
                        "start": {
                          "column": 20,
                          "line": 1,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "value",
                      "position": {
                        "end": {
                          "column": 74,
                          "line": 3,
                        },
                        "start": {
                          "column": 61,
                          "line": 3,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                  ],
                  "type": "BaseProps & { value: string; }",
                },
              ],
              "name": "props",
              "position": {
                "end": {
                  "column": 32,
                  "line": 5,
                },
                "start": {
                  "column": 20,
                  "line": 5,
                },
              },
              "type": "Props",
            },
            "returnType": "void",
            "type": "function Component(props: Props): void",
          },
        ],
        "type": "(props: Props) => void",
      }
    `)
  })

  test('union types with primitive types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type Props = { color: string } | string;

      function Component(props: Props) {}
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('Component')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "Component",
        "position": {
          "end": {
            "column": 36,
            "line": 3,
          },
          "start": {
            "column": 1,
            "line": 3,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Union",
                "members": [
                  {
                    "filePath": "node_modules/typescript/lib/lib.es5.d.ts",
                    "kind": "String",
                    "name": undefined,
                    "position": {
                      "end": {
                        "column": 4402,
                        "line": 4,
                      },
                      "start": {
                        "column": 3482,
                        "line": 4,
                      },
                    },
                    "type": "string",
                    "value": undefined,
                  },
                  {
                    "filePath": "test.ts",
                    "kind": "Object",
                    "name": undefined,
                    "position": {
                      "end": {
                        "column": 31,
                        "line": 1,
                      },
                      "start": {
                        "column": 14,
                        "line": 1,
                      },
                    },
                    "properties": [
                      {
                        "defaultValue": undefined,
                        "filePath": "test.ts",
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "color",
                        "position": {
                          "end": {
                            "column": 29,
                            "line": 1,
                          },
                          "start": {
                            "column": 16,
                            "line": 1,
                          },
                        },
                        "type": "string",
                        "value": undefined,
                      },
                    ],
                    "type": "{ color: string; }",
                  },
                ],
                "name": "props",
                "position": {
                  "end": {
                    "column": 32,
                    "line": 3,
                  },
                  "start": {
                    "column": 20,
                    "line": 3,
                  },
                },
                "type": "Props",
              },
            ],
            "returnType": "void",
            "type": "function Component(props: Props): void",
          },
        ],
        "type": "(props: Props) => void",
      }
    `)
  })

  test('union types with external types', () => {
    project.createSourceFile(
      'types.ts',
      `export type BaseProps = { color: string }`,
      { overwrite: true }
    )
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import { BaseProps } from './types';
      
      type Props = BaseProps & { source: string } | BaseProps & { value: string };
      
      function Component(props: Props) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "Component",
        "position": {
          "end": {
            "column": 36,
            "line": 5,
          },
          "start": {
            "column": 1,
            "line": 5,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Union",
                "members": [
                  {
                    "filePath": "test.ts",
                    "kind": "Intersection",
                    "name": undefined,
                    "position": {
                      "end": {
                        "column": 77,
                        "line": 3,
                      },
                      "start": {
                        "column": 1,
                        "line": 3,
                      },
                    },
                    "properties": [
                      {
                        "filePath": "types.ts",
                        "kind": "Reference",
                        "position": {
                          "end": {
                            "column": 42,
                            "line": 1,
                          },
                          "start": {
                            "column": 1,
                            "line": 1,
                          },
                        },
                        "type": "BaseProps",
                      },
                      {
                        "defaultValue": undefined,
                        "filePath": "test.ts",
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "source",
                        "position": {
                          "end": {
                            "column": 42,
                            "line": 3,
                          },
                          "start": {
                            "column": 28,
                            "line": 3,
                          },
                        },
                        "type": "string",
                        "value": undefined,
                      },
                    ],
                    "type": "BaseProps & { source: string; }",
                  },
                  {
                    "filePath": "test.ts",
                    "kind": "Intersection",
                    "name": undefined,
                    "position": {
                      "end": {
                        "column": 77,
                        "line": 3,
                      },
                      "start": {
                        "column": 1,
                        "line": 3,
                      },
                    },
                    "properties": [
                      {
                        "filePath": "types.ts",
                        "kind": "Reference",
                        "position": {
                          "end": {
                            "column": 42,
                            "line": 1,
                          },
                          "start": {
                            "column": 1,
                            "line": 1,
                          },
                        },
                        "type": "BaseProps",
                      },
                      {
                        "defaultValue": undefined,
                        "filePath": "test.ts",
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "value",
                        "position": {
                          "end": {
                            "column": 74,
                            "line": 3,
                          },
                          "start": {
                            "column": 61,
                            "line": 3,
                          },
                        },
                        "type": "string",
                        "value": undefined,
                      },
                    ],
                    "type": "BaseProps & { value: string; }",
                  },
                ],
                "name": "props",
                "position": {
                  "end": {
                    "column": 32,
                    "line": 5,
                  },
                  "start": {
                    "column": 20,
                    "line": 5,
                  },
                },
                "type": "Props",
              },
            ],
            "returnType": "void",
            "type": "function Component(props: Props): void",
          },
        ],
        "type": "(props: Props) => void",
      }
    `)
  })

  test('mapped types without declarations', () => {
    project.createSourceFile(
      'theme.ts',
      `export const textStyles = { heading1: {}, heading2: {}, heading3: {}, body1: {}, }`
    )
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import { textStyles } from './theme'

      export type DropDollarPrefix<T> = {
        [K in keyof T as K extends \`$\${infer I}\` ? I : K]: T[K]
      }
      
      export type TextVariants = keyof typeof textStyles
      
      type StyledTextProps = {
        $variant?: TextVariants
        $alignment?: 'start' | 'center' | 'end'
        $width?: string | number
        $lineHeight?: string
      }
      
      export type TextProps = {
        className?: string
        children: ReactNode
      } & DropDollarPrefix<StyledTextProps>
      
      export const Text = (props: TextProps) => {
        const {
          variant = 'body1',
          alignment,
          width,
          lineHeight,
          children,
        } = props
      }`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('Text')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Component",
        "name": "Text",
        "position": {
          "end": {
            "column": 2,
            "line": 29,
          },
          "start": {
            "column": 14,
            "line": 21,
          },
        },
        "signatures": [
          {
            "kind": "ComponentSignature",
            "modifier": undefined,
            "properties": {
              "defaultValue": {
                "variant": "body1",
              },
              "description": undefined,
              "filePath": "test.ts",
              "isOptional": false,
              "kind": "Reference",
              "name": "props",
              "position": {
                "end": {
                  "column": 38,
                  "line": 21,
                },
                "start": {
                  "column": 22,
                  "line": 21,
                },
              },
              "type": "TextProps",
            },
            "returnType": "void",
            "type": "(props: TextProps) => void",
          },
        ],
        "type": "(props: TextProps) => void",
      }
    `)
  })

  test('library call expression generic types', () => {
    const project = new Project({
      compilerOptions: { strictNullChecks: false },
      tsConfigFilePath: 'tsconfig.json',
    })
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import styled from 'styled-components'

      type GridProps = {
        gridTemplateColumns: string
        gridTemplateRows?: string
      }

      export const Grid = styled.div<GridProps>((props) => ({
        display: 'grid',
        gridTemplateColumns: props.gridTemplateColumns,
        gridTemplateRows: props.gridTemplateRows,
      }))
      `
    )
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('Grid')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Intersection",
        "name": undefined,
        "position": {
          "end": {
            "column": 4,
            "line": 12,
          },
          "start": {
            "column": 14,
            "line": 8,
          },
        },
        "properties": [
          {
            "filePath": "test.ts",
            "kind": "Component",
            "name": "Grid",
            "position": {
              "end": {
                "column": 4,
                "line": 12,
              },
              "start": {
                "column": 14,
                "line": 8,
              },
            },
            "signatures": [
              {
                "kind": "ComponentSignature",
                "modifier": undefined,
                "properties": {
                  "defaultValue": undefined,
                  "description": undefined,
                  "filePath": "node_modules/@types/react/index.d.ts",
                  "isOptional": false,
                  "kind": "Object",
                  "name": "props",
                  "position": {
                    "end": {
                      "column": 18,
                      "line": 635,
                    },
                    "start": {
                      "column": 10,
                      "line": 635,
                    },
                  },
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "gridTemplateColumns",
                      "position": {
                        "end": {
                          "column": 30,
                          "line": 4,
                        },
                        "start": {
                          "column": 3,
                          "line": 4,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "gridTemplateRows",
                      "position": {
                        "end": {
                          "column": 28,
                          "line": 5,
                        },
                        "start": {
                          "column": 3,
                          "line": 5,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                  ],
                  "type": "Substitute<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, GridProps>",
                },
                "returnType": "ReactNode",
                "type": "(props: Substitute<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, GridProps>) => ReactNode",
              },
            ],
            "type": "IStyledComponentBase<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, GridProps>>",
          },
          {
            "filePath": "test.ts",
            "kind": "String",
            "name": "Grid",
            "position": {
              "end": {
                "column": 4,
                "line": 12,
              },
              "start": {
                "column": 14,
                "line": 8,
              },
            },
            "type": "string",
            "value": undefined,
          },
        ],
        "type": "IStyledComponentBase<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, GridProps>> & string",
      }
    `)
  })

  test('library tagged template literal generic types', () => {
    const project = new Project({ tsConfigFilePath: 'tsconfig.json' })
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import * as React from 'react'
      import styled from 'styled-components'

      export const Grid = styled.div<{
        $gridTemplateColumns: string
        $gridTemplateRows: string
      }>\`
        display: grid;
        grid-template-columns: \${({ $gridTemplateColumns }) => $gridTemplateColumns};
        grid-template-rows: \${({ $gridTemplateRows }) => $gridTemplateRows};
      \`
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('Grid')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Intersection",
        "name": undefined,
        "position": {
          "end": {
            "column": 2,
            "line": 11,
          },
          "start": {
            "column": 14,
            "line": 4,
          },
        },
        "properties": [
          {
            "filePath": "test.ts",
            "kind": "Component",
            "name": "Grid",
            "position": {
              "end": {
                "column": 2,
                "line": 11,
              },
              "start": {
                "column": 14,
                "line": 4,
              },
            },
            "signatures": [
              {
                "kind": "ComponentSignature",
                "modifier": undefined,
                "properties": {
                  "defaultValue": undefined,
                  "description": undefined,
                  "filePath": "node_modules/@types/react/index.d.ts",
                  "isOptional": false,
                  "kind": "Object",
                  "name": "props",
                  "position": {
                    "end": {
                      "column": 18,
                      "line": 635,
                    },
                    "start": {
                      "column": 10,
                      "line": 635,
                    },
                  },
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "$gridTemplateColumns",
                      "position": {
                        "end": {
                          "column": 31,
                          "line": 5,
                        },
                        "start": {
                          "column": 3,
                          "line": 5,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "$gridTemplateRows",
                      "position": {
                        "end": {
                          "column": 28,
                          "line": 6,
                        },
                        "start": {
                          "column": 3,
                          "line": 6,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                  ],
                  "type": "Substitute<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, { $gridTemplateColumns: string; $gridTemplateRows: string; }>",
                },
                "returnType": "ReactNode",
                "type": "(props: Substitute<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, { $gridTemplateColumns: string; $gridTemplateRows: string; }>) => ReactNode",
              },
            ],
            "type": "IStyledComponentBase<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, { $gridTemplateColumns: string; $gridTemplateRows: string; }>>",
          },
          {
            "filePath": "test.ts",
            "kind": "String",
            "name": "Grid",
            "position": {
              "end": {
                "column": 2,
                "line": 11,
              },
              "start": {
                "column": 14,
                "line": 4,
              },
            },
            "type": "string",
            "value": undefined,
          },
        ],
        "type": "IStyledComponentBase<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, { $gridTemplateColumns: string; $gridTemplateRows: string; }>> & string",
      }
    `)
  })

  test('type aliases', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      export type Props = {
        variant: 'heading1' | 'heading2' | 'heading3' | 'body1' | 'body2'
        width?: string | number
      }
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(sourceFile.getTypeAliasOrThrow('Props'))

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "Props",
        "position": {
          "end": {
            "column": 2,
            "line": 4,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Union",
            "members": [
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 68,
                    "line": 2,
                  },
                  "start": {
                    "column": 3,
                    "line": 2,
                  },
                },
                "type": ""heading1"",
                "value": "heading1",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 68,
                    "line": 2,
                  },
                  "start": {
                    "column": 3,
                    "line": 2,
                  },
                },
                "type": ""heading2"",
                "value": "heading2",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 68,
                    "line": 2,
                  },
                  "start": {
                    "column": 3,
                    "line": 2,
                  },
                },
                "type": ""heading3"",
                "value": "heading3",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 68,
                    "line": 2,
                  },
                  "start": {
                    "column": 3,
                    "line": 2,
                  },
                },
                "type": ""body1"",
                "value": "body1",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 68,
                    "line": 2,
                  },
                  "start": {
                    "column": 3,
                    "line": 2,
                  },
                },
                "type": ""body2"",
                "value": "body2",
              },
            ],
            "name": "variant",
            "position": {
              "end": {
                "column": 68,
                "line": 2,
              },
              "start": {
                "column": 3,
                "line": 2,
              },
            },
            "type": ""heading1" | "heading2" | "heading3" | "body1" | "body2"",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": true,
            "isReadonly": false,
            "kind": "Union",
            "members": [
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 26,
                    "line": 3,
                  },
                  "start": {
                    "column": 3,
                    "line": 3,
                  },
                },
                "type": "string",
                "value": undefined,
              },
              {
                "filePath": "test.ts",
                "kind": "Number",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 26,
                    "line": 3,
                  },
                  "start": {
                    "column": 3,
                    "line": 3,
                  },
                },
                "type": "number",
                "value": undefined,
              },
            ],
            "name": "width",
            "position": {
              "end": {
                "column": 26,
                "line": 3,
              },
              "start": {
                "column": 3,
                "line": 3,
              },
            },
            "type": "string | number",
          },
        ],
        "type": "Props",
      }
    `)
  })

  test('interface declarations', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      interface BaseProps {
        color: string
      }
      interface Props extends BaseProps {
        variant: 'heading1' | 'heading2' | 'heading3' | 'body1' | 'body2'
        width?: string | number
      }
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(sourceFile.getInterfaceOrThrow('Props'))

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "Props",
        "position": {
          "end": {
            "column": 2,
            "line": 7,
          },
          "start": {
            "column": 1,
            "line": 4,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Union",
            "members": [
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 68,
                    "line": 5,
                  },
                  "start": {
                    "column": 3,
                    "line": 5,
                  },
                },
                "type": ""heading1"",
                "value": "heading1",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 68,
                    "line": 5,
                  },
                  "start": {
                    "column": 3,
                    "line": 5,
                  },
                },
                "type": ""heading2"",
                "value": "heading2",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 68,
                    "line": 5,
                  },
                  "start": {
                    "column": 3,
                    "line": 5,
                  },
                },
                "type": ""heading3"",
                "value": "heading3",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 68,
                    "line": 5,
                  },
                  "start": {
                    "column": 3,
                    "line": 5,
                  },
                },
                "type": ""body1"",
                "value": "body1",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 68,
                    "line": 5,
                  },
                  "start": {
                    "column": 3,
                    "line": 5,
                  },
                },
                "type": ""body2"",
                "value": "body2",
              },
            ],
            "name": "variant",
            "position": {
              "end": {
                "column": 68,
                "line": 5,
              },
              "start": {
                "column": 3,
                "line": 5,
              },
            },
            "type": ""heading1" | "heading2" | "heading3" | "body1" | "body2"",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": true,
            "isReadonly": false,
            "kind": "Union",
            "members": [
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 26,
                    "line": 6,
                  },
                  "start": {
                    "column": 3,
                    "line": 6,
                  },
                },
                "type": "string",
                "value": undefined,
              },
              {
                "filePath": "test.ts",
                "kind": "Number",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 26,
                    "line": 6,
                  },
                  "start": {
                    "column": 3,
                    "line": 6,
                  },
                },
                "type": "number",
                "value": undefined,
              },
            ],
            "name": "width",
            "position": {
              "end": {
                "column": 26,
                "line": 6,
              },
              "start": {
                "column": 3,
                "line": 6,
              },
            },
            "type": "string | number",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "String",
            "name": "color",
            "position": {
              "end": {
                "column": 16,
                "line": 2,
              },
              "start": {
                "column": 3,
                "line": 2,
              },
            },
            "type": "string",
            "value": undefined,
          },
        ],
        "type": "Props",
      }
    `)
  })

  test('enum declarations', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `enum Colors {
        Red = 'RED',
        Green = 'GREEN',
        Blue = 'BLUE'
      }`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(sourceFile.getEnumOrThrow('Colors'))

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Enum",
        "members": {
          "Blue": "BLUE",
          "Green": "GREEN",
          "Red": "RED",
        },
        "name": "Colors",
        "position": {
          "end": {
            "column": 8,
            "line": 5,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "type": "Colors",
      }
    `)
  })

  test('class declarations', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      class Counter {
        initialCount: number = 0;
        
        private count: number = 0;
        
        static staticCount: number = 0;
  
        /** Constructs a new counter. */
        constructor(initialCount: number = 0) {
          this.count = count;
          this.initialCount = initialCount;
          Counter.staticCount++;
        }
  
        /** Increments the count. */
        increment() {
          this.count++;
        }

        /** Decrements the count. */
        decrement() {
          this.count--;
        }

        /** Sets the count. */
        set accessorCount(value: number) {
          this.count = value;
        }

        /** Returns the current count. */
        get accessorCount(): number {
          return this.count;
        }
  
        /** Returns the current count. */
        public getCount(isFloored?: boolean = true): number {
          return isFloored ? Math.floor(this.count) : this.count;
        }
  
        static getStaticCount(): number {
          return Counter.staticCount;
        }
      }
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(sourceFile.getClassOrThrow('Counter'))

    expect(types).toMatchInlineSnapshot(`
      {
        "accessors": [
          {
            "description": "Sets the count.",
            "kind": "ClassSetAccessor",
            "modifier": undefined,
            "name": "accessorCount",
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Number",
                "name": "value",
                "position": {
                  "end": {
                    "column": 34,
                    "line": 26,
                  },
                  "start": {
                    "column": 21,
                    "line": 26,
                  },
                },
                "type": "number",
                "value": undefined,
              },
            ],
            "returnType": "void",
            "scope": undefined,
            "tags": undefined,
            "type": "number",
            "visibility": undefined,
          },
          {
            "description": "Returns the current count.",
            "kind": "ClassGetAccessor",
            "name": "accessorCount",
            "scope": undefined,
            "tags": undefined,
            "type": "number",
            "visibility": undefined,
          },
        ],
        "constructors": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": 0,
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Number",
                "name": "initialCount",
                "position": {
                  "end": {
                    "column": 39,
                    "line": 9,
                  },
                  "start": {
                    "column": 15,
                    "line": 9,
                  },
                },
                "type": "number",
                "value": undefined,
              },
            ],
            "returnType": "Counter",
            "type": "(initialCount: number) => Counter",
          },
        ],
        "filePath": "test.ts",
        "kind": "Class",
        "methods": [
          {
            "description": "Increments the count.",
            "kind": "ClassMethod",
            "name": "increment",
            "scope": undefined,
            "signatures": [
              {
                "kind": "FunctionSignature",
                "modifier": undefined,
                "parameters": [],
                "returnType": "void",
                "type": "() => void",
              },
            ],
            "tags": undefined,
            "type": "() => void",
            "visibility": undefined,
          },
          {
            "description": "Decrements the count.",
            "kind": "ClassMethod",
            "name": "decrement",
            "scope": undefined,
            "signatures": [
              {
                "kind": "FunctionSignature",
                "modifier": undefined,
                "parameters": [],
                "returnType": "void",
                "type": "() => void",
              },
            ],
            "tags": undefined,
            "type": "() => void",
            "visibility": undefined,
          },
          {
            "description": "Returns the current count.",
            "kind": "ClassMethod",
            "name": "getCount",
            "scope": undefined,
            "signatures": [
              {
                "kind": "FunctionSignature",
                "modifier": undefined,
                "parameters": [
                  {
                    "defaultValue": true,
                    "description": undefined,
                    "filePath": "test.ts",
                    "isOptional": true,
                    "kind": "Boolean",
                    "name": "isFloored",
                    "position": {
                      "end": {
                        "column": 45,
                        "line": 36,
                      },
                      "start": {
                        "column": 19,
                        "line": 36,
                      },
                    },
                    "type": "boolean",
                  },
                ],
                "returnType": "number",
                "type": "(isFloored?: boolean) => number",
              },
            ],
            "tags": undefined,
            "type": "(isFloored?: boolean) => number",
            "visibility": "public",
          },
          {
            "kind": "ClassMethod",
            "name": "getStaticCount",
            "scope": "static",
            "signatures": [
              {
                "kind": "FunctionSignature",
                "modifier": undefined,
                "parameters": [],
                "returnType": "number",
                "type": "() => number",
              },
            ],
            "type": "() => number",
            "visibility": undefined,
          },
        ],
        "name": "Counter",
        "position": {
          "end": {
            "column": 2,
            "line": 43,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "properties": [
          {
            "defaultValue": 0,
            "filePath": "test.ts",
            "isReadonly": false,
            "kind": "Number",
            "name": "initialCount",
            "position": {
              "end": {
                "column": 28,
                "line": 2,
              },
              "start": {
                "column": 3,
                "line": 2,
              },
            },
            "scope": undefined,
            "type": "number",
            "value": undefined,
            "visibility": undefined,
          },
          {
            "defaultValue": 0,
            "filePath": "test.ts",
            "isReadonly": false,
            "kind": "Number",
            "name": "staticCount",
            "position": {
              "end": {
                "column": 34,
                "line": 6,
              },
              "start": {
                "column": 3,
                "line": 6,
              },
            },
            "scope": "static",
            "type": "number",
            "value": undefined,
            "visibility": undefined,
          },
        ],
        "type": "Counter",
      }
    `)
  })

  test('renamed property default values', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function useCounter({ initialCount: renamedInitialCount = 0 }: { initialCount: number } = {}) {}`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('useCounter')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "useCounter",
        "position": {
          "end": {
            "column": 97,
            "line": 1,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": {
                  "initialCount": 0,
                },
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Object",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 93,
                    "line": 1,
                  },
                  "start": {
                    "column": 21,
                    "line": 1,
                  },
                },
                "properties": [
                  {
                    "defaultValue": 0,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "initialCount",
                    "position": {
                      "end": {
                        "column": 86,
                        "line": 1,
                      },
                      "start": {
                        "column": 66,
                        "line": 1,
                      },
                    },
                    "type": "number",
                    "value": undefined,
                  },
                ],
                "type": "{ initialCount: number; }",
              },
            ],
            "returnType": "void",
            "type": "function useCounter({ initialCount: number; }): void",
          },
        ],
        "type": "({ initialCount: renamedInitialCount }?: {    initialCount: number;}) => void",
      }
    `)
  })

  test('multiple arguments', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function add(a: number, b: number = 0): number { return a + b }`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(sourceFile.getFunctionOrThrow('add'))

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "add",
        "position": {
          "end": {
            "column": 64,
            "line": 1,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Number",
                "name": "a",
                "position": {
                  "end": {
                    "column": 23,
                    "line": 1,
                  },
                  "start": {
                    "column": 14,
                    "line": 1,
                  },
                },
                "type": "number",
                "value": undefined,
              },
              {
                "defaultValue": 0,
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Number",
                "name": "b",
                "position": {
                  "end": {
                    "column": 38,
                    "line": 1,
                  },
                  "start": {
                    "column": 25,
                    "line": 1,
                  },
                },
                "type": "number",
                "value": undefined,
              },
            ],
            "returnType": "number",
            "type": "function add(a: number, b: number): number",
          },
        ],
        "type": "(a: number, b?: number) => number",
      }
    `)
  })

  test('type with union', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type ButtonVariants = { color:string } & ({ backgroundColor: string } | { borderColor: string })
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getTypeAliasOrThrow('ButtonVariants')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Union",
        "members": [
          {
            "filePath": "test.ts",
            "kind": "Object",
            "name": undefined,
            "position": {
              "end": {
                "column": 97,
                "line": 1,
              },
              "start": {
                "column": 1,
                "line": 1,
              },
            },
            "properties": [
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "color",
                "position": {
                  "end": {
                    "column": 37,
                    "line": 1,
                  },
                  "start": {
                    "column": 25,
                    "line": 1,
                  },
                },
                "type": "string",
                "value": undefined,
              },
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "backgroundColor",
                "position": {
                  "end": {
                    "column": 68,
                    "line": 1,
                  },
                  "start": {
                    "column": 45,
                    "line": 1,
                  },
                },
                "type": "string",
                "value": undefined,
              },
            ],
            "type": "{ color: string; } & { backgroundColor: string; }",
          },
          {
            "filePath": "test.ts",
            "kind": "Object",
            "name": undefined,
            "position": {
              "end": {
                "column": 97,
                "line": 1,
              },
              "start": {
                "column": 1,
                "line": 1,
              },
            },
            "properties": [
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "color",
                "position": {
                  "end": {
                    "column": 37,
                    "line": 1,
                  },
                  "start": {
                    "column": 25,
                    "line": 1,
                  },
                },
                "type": "string",
                "value": undefined,
              },
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "borderColor",
                "position": {
                  "end": {
                    "column": 94,
                    "line": 1,
                  },
                  "start": {
                    "column": 75,
                    "line": 1,
                  },
                },
                "type": "string",
                "value": undefined,
              },
            ],
            "type": "{ color: string; } & { borderColor: string; }",
          },
        ],
        "name": "ButtonVariants",
        "position": {
          "end": {
            "column": 97,
            "line": 1,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "type": "ButtonVariants",
      }
    `)
  })

  test('property with union', () => {
    const project = new Project()
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type Config = {
        siteName: string
        settings: {
          apiEndpoint: string;
          apiKey: string;
        } | {
          dbHost: string;
          dbPort: number;
          dbName: string;
        };
      }
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(sourceFile.getTypeAliasOrThrow('Config'))

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "Config",
        "position": {
          "end": {
            "column": 2,
            "line": 11,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "String",
            "name": "siteName",
            "position": {
              "end": {
                "column": 19,
                "line": 2,
              },
              "start": {
                "column": 3,
                "line": 2,
              },
            },
            "type": "string",
            "value": undefined,
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Union",
            "members": [
              {
                "filePath": "test.ts",
                "kind": "Object",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 5,
                    "line": 10,
                  },
                  "start": {
                    "column": 3,
                    "line": 3,
                  },
                },
                "properties": [
                  {
                    "defaultValue": undefined,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "apiEndpoint",
                    "position": {
                      "end": {
                        "column": 25,
                        "line": 4,
                      },
                      "start": {
                        "column": 5,
                        "line": 4,
                      },
                    },
                    "type": "string",
                    "value": undefined,
                  },
                  {
                    "defaultValue": undefined,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "apiKey",
                    "position": {
                      "end": {
                        "column": 20,
                        "line": 5,
                      },
                      "start": {
                        "column": 5,
                        "line": 5,
                      },
                    },
                    "type": "string",
                    "value": undefined,
                  },
                ],
                "type": "{ apiEndpoint: string; apiKey: string; }",
              },
              {
                "filePath": "test.ts",
                "kind": "Object",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 5,
                    "line": 10,
                  },
                  "start": {
                    "column": 3,
                    "line": 3,
                  },
                },
                "properties": [
                  {
                    "defaultValue": undefined,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "dbHost",
                    "position": {
                      "end": {
                        "column": 20,
                        "line": 7,
                      },
                      "start": {
                        "column": 5,
                        "line": 7,
                      },
                    },
                    "type": "string",
                    "value": undefined,
                  },
                  {
                    "defaultValue": undefined,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "dbPort",
                    "position": {
                      "end": {
                        "column": 20,
                        "line": 8,
                      },
                      "start": {
                        "column": 5,
                        "line": 8,
                      },
                    },
                    "type": "number",
                    "value": undefined,
                  },
                  {
                    "defaultValue": undefined,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "dbName",
                    "position": {
                      "end": {
                        "column": 20,
                        "line": 9,
                      },
                      "start": {
                        "column": 5,
                        "line": 9,
                      },
                    },
                    "type": "string",
                    "value": undefined,
                  },
                ],
                "type": "{ dbHost: string; dbPort: number; dbName: string; }",
              },
            ],
            "name": "settings",
            "position": {
              "end": {
                "column": 5,
                "line": 10,
              },
              "start": {
                "column": 3,
                "line": 3,
              },
            },
            "type": "{ apiEndpoint: string; apiKey: string; } | { dbHost: string; dbPort: number; dbName: string; }",
          },
        ],
        "type": "Config",
      }
    `)
  })

  test('argument with union', () => {
    const project = new Project()
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      function useCounter(
        settings: { apiEndpoint: string; apiKey: string; } | { dbHost: string; dbPort: number; dbName: string; }
      ) {}
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('useCounter')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "useCounter",
        "position": {
          "end": {
            "column": 5,
            "line": 3,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Union",
                "members": [
                  {
                    "filePath": "test.ts",
                    "kind": "Object",
                    "name": undefined,
                    "position": {
                      "end": {
                        "column": 107,
                        "line": 2,
                      },
                      "start": {
                        "column": 3,
                        "line": 2,
                      },
                    },
                    "properties": [
                      {
                        "defaultValue": undefined,
                        "filePath": "test.ts",
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "apiEndpoint",
                        "position": {
                          "end": {
                            "column": 35,
                            "line": 2,
                          },
                          "start": {
                            "column": 15,
                            "line": 2,
                          },
                        },
                        "type": "string",
                        "value": undefined,
                      },
                      {
                        "defaultValue": undefined,
                        "filePath": "test.ts",
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "apiKey",
                        "position": {
                          "end": {
                            "column": 51,
                            "line": 2,
                          },
                          "start": {
                            "column": 36,
                            "line": 2,
                          },
                        },
                        "type": "string",
                        "value": undefined,
                      },
                    ],
                    "type": "{ apiEndpoint: string; apiKey: string; }",
                  },
                  {
                    "filePath": "test.ts",
                    "kind": "Object",
                    "name": undefined,
                    "position": {
                      "end": {
                        "column": 107,
                        "line": 2,
                      },
                      "start": {
                        "column": 3,
                        "line": 2,
                      },
                    },
                    "properties": [
                      {
                        "defaultValue": undefined,
                        "filePath": "test.ts",
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "dbHost",
                        "position": {
                          "end": {
                            "column": 73,
                            "line": 2,
                          },
                          "start": {
                            "column": 58,
                            "line": 2,
                          },
                        },
                        "type": "string",
                        "value": undefined,
                      },
                      {
                        "defaultValue": undefined,
                        "filePath": "test.ts",
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "Number",
                        "name": "dbPort",
                        "position": {
                          "end": {
                            "column": 89,
                            "line": 2,
                          },
                          "start": {
                            "column": 74,
                            "line": 2,
                          },
                        },
                        "type": "number",
                        "value": undefined,
                      },
                      {
                        "defaultValue": undefined,
                        "filePath": "test.ts",
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "dbName",
                        "position": {
                          "end": {
                            "column": 105,
                            "line": 2,
                          },
                          "start": {
                            "column": 90,
                            "line": 2,
                          },
                        },
                        "type": "string",
                        "value": undefined,
                      },
                    ],
                    "type": "{ dbHost: string; dbPort: number; dbName: string; }",
                  },
                ],
                "name": "settings",
                "position": {
                  "end": {
                    "column": 107,
                    "line": 2,
                  },
                  "start": {
                    "column": 3,
                    "line": 2,
                  },
                },
                "type": "{ apiEndpoint: string; apiKey: string; } | { dbHost: string; dbPort: number; dbName: string; }",
              },
            ],
            "returnType": "void",
            "type": "function useCounter(settings: { apiEndpoint: string; apiKey: string; } | { dbHost: string; dbPort: number; dbName: string; }): void",
          },
        ],
        "type": "(settings: {    apiEndpoint: string;    apiKey: string;} | {    dbHost: string;    dbPort: number;    dbName: string;}) => void",
      }
    `)
  })

  test('allows filtering specific node module types', () => {
    const sourceFile = project.createSourceFile(
      'test.tsx',
      dedent`
      import * as React from 'react';

      type ButtonVariant = 'primary' | 'secondary' | 'danger';

      type ButtonProps = {
        variant?: ButtonVariant;
      } & React.ButtonHTMLAttributes<HTMLButtonElement>

      export const Button = (props: ButtonProps) => {
        return <button {...props} />
      };
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('Button'),
      (symbolMetadata) => {
        if (symbolMetadata.name === 'onClick') {
          return true
        }
        return !symbolMetadata.isInNodeModules
      }
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.tsx",
        "kind": "Component",
        "name": "Button",
        "position": {
          "end": {
            "column": 2,
            "line": 11,
          },
          "start": {
            "column": 14,
            "line": 9,
          },
        },
        "signatures": [
          {
            "kind": "ComponentSignature",
            "modifier": undefined,
            "properties": {
              "defaultValue": undefined,
              "description": undefined,
              "filePath": "test.tsx",
              "isOptional": false,
              "kind": "Object",
              "name": "props",
              "position": {
                "end": {
                  "column": 42,
                  "line": 9,
                },
                "start": {
                  "column": 24,
                  "line": 9,
                },
              },
              "properties": [
                {
                  "defaultValue": undefined,
                  "filePath": "test.tsx",
                  "isOptional": true,
                  "isReadonly": false,
                  "kind": "Union",
                  "members": [
                    {
                      "filePath": "node_modules/typescript/lib/lib.es5.d.ts",
                      "kind": "String",
                      "name": undefined,
                      "position": {
                        "end": {
                          "column": 4402,
                          "line": 4,
                        },
                        "start": {
                          "column": 3482,
                          "line": 4,
                        },
                      },
                      "type": ""primary"",
                      "value": "primary",
                    },
                    {
                      "filePath": "node_modules/typescript/lib/lib.es5.d.ts",
                      "kind": "String",
                      "name": undefined,
                      "position": {
                        "end": {
                          "column": 4402,
                          "line": 4,
                        },
                        "start": {
                          "column": 3482,
                          "line": 4,
                        },
                      },
                      "type": ""secondary"",
                      "value": "secondary",
                    },
                    {
                      "filePath": "node_modules/typescript/lib/lib.es5.d.ts",
                      "kind": "String",
                      "name": undefined,
                      "position": {
                        "end": {
                          "column": 4402,
                          "line": 4,
                        },
                        "start": {
                          "column": 3482,
                          "line": 4,
                        },
                      },
                      "type": ""danger"",
                      "value": "danger",
                    },
                  ],
                  "name": "variant",
                  "position": {
                    "end": {
                      "column": 27,
                      "line": 6,
                    },
                    "start": {
                      "column": 3,
                      "line": 6,
                    },
                  },
                  "type": "ButtonVariant",
                },
                {
                  "defaultValue": undefined,
                  "filePath": "node_modules/@types/react/index.d.ts",
                  "isOptional": true,
                  "isReadonly": false,
                  "kind": "Function",
                  "name": "onClick",
                  "position": {
                    "end": {
                      "column": 52,
                      "line": 2489,
                    },
                    "start": {
                      "column": 9,
                      "line": 2489,
                    },
                  },
                  "signatures": [],
                  "type": "MouseEventHandler<HTMLButtonElement>",
                },
              ],
              "type": "ButtonProps",
            },
            "returnType": "Element",
            "type": "(props: ButtonProps) => Element",
          },
        ],
        "type": "(props: ButtonProps) => React.JSX.Element",
      }
    `)
  })

  test('function types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import * as React from 'react';

      export function getExportedTypes() {
        return [
          { 
            /** The name of the component. */ 
            name: 'Button',

            /** The description of the component. */
            description: 'A button component' 
          }
        ]
      }
      
      type BaseExportedTypesProps = {
        /** Controls how types are rendered. */
        children?: (
          exportedTypes: ReturnType<typeof getExportedTypes>
        ) => React.ReactNode
      }

      type ExportedTypesProps =
        | ({ source: string } & BaseExportedTypesProps)
        | ({ filename: string; value: string } & BaseExportedTypesProps)
      
      function ExportedTypes({ children }: ExportedTypesProps) {}
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('ExportedTypes')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Component",
        "name": "ExportedTypes",
        "position": {
          "end": {
            "column": 60,
            "line": 26,
          },
          "start": {
            "column": 1,
            "line": 26,
          },
        },
        "signatures": [
          {
            "kind": "ComponentSignature",
            "modifier": undefined,
            "properties": {
              "defaultValue": undefined,
              "description": undefined,
              "filePath": "test.ts",
              "isOptional": false,
              "kind": "Union",
              "members": [
                {
                  "filePath": "test.ts",
                  "kind": "Object",
                  "name": undefined,
                  "position": {
                    "end": {
                      "column": 67,
                      "line": 24,
                    },
                    "start": {
                      "column": 1,
                      "line": 22,
                    },
                  },
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "source",
                      "position": {
                        "end": {
                          "column": 22,
                          "line": 23,
                        },
                        "start": {
                          "column": 8,
                          "line": 23,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                    {
                      "defaultValue": undefined,
                      "description": "Controls how types are rendered.",
                      "filePath": "test.ts",
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "Function",
                      "name": "children",
                      "position": {
                        "end": {
                          "column": 23,
                          "line": 19,
                        },
                        "start": {
                          "column": 3,
                          "line": 17,
                        },
                      },
                      "signatures": [
                        {
                          "kind": "FunctionSignature",
                          "modifier": undefined,
                          "parameters": [
                            {
                              "defaultValue": undefined,
                              "description": undefined,
                              "element": {
                                "filePath": "test.ts",
                                "kind": "Object",
                                "name": undefined,
                                "position": {
                                  "end": {
                                    "column": 6,
                                    "line": 11,
                                  },
                                  "start": {
                                    "column": 5,
                                    "line": 5,
                                  },
                                },
                                "properties": [
                                  {
                                    "defaultValue": undefined,
                                    "filePath": "test.ts",
                                    "isOptional": false,
                                    "isReadonly": false,
                                    "kind": "String",
                                    "name": "name",
                                    "position": {
                                      "end": {
                                        "column": 21,
                                        "line": 7,
                                      },
                                      "start": {
                                        "column": 7,
                                        "line": 7,
                                      },
                                    },
                                    "type": "string",
                                    "value": undefined,
                                  },
                                  {
                                    "defaultValue": undefined,
                                    "filePath": "test.ts",
                                    "isOptional": false,
                                    "isReadonly": false,
                                    "kind": "String",
                                    "name": "description",
                                    "position": {
                                      "end": {
                                        "column": 40,
                                        "line": 10,
                                      },
                                      "start": {
                                        "column": 7,
                                        "line": 10,
                                      },
                                    },
                                    "type": "string",
                                    "value": undefined,
                                  },
                                ],
                                "type": "{ name: string; description: string; }",
                              },
                              "filePath": "test.ts",
                              "isOptional": false,
                              "kind": "Array",
                              "name": "exportedTypes",
                              "position": {
                                "end": {
                                  "column": 55,
                                  "line": 18,
                                },
                                "start": {
                                  "column": 5,
                                  "line": 18,
                                },
                              },
                              "type": "Array<{ name: string; description: string; }>",
                            },
                          ],
                          "returnType": "ReactNode",
                          "type": "(exportedTypes: Array<{ name: string; description: string; }>) => ReactNode",
                        },
                      ],
                      "tags": undefined,
                      "type": "(exportedTypes: ReturnType<typeof getExportedTypes>) => React.ReactNode",
                    },
                  ],
                  "type": "{ source: string; } & BaseExportedTypesProps",
                },
                {
                  "filePath": "test.ts",
                  "kind": "Object",
                  "name": undefined,
                  "position": {
                    "end": {
                      "column": 67,
                      "line": 24,
                    },
                    "start": {
                      "column": 1,
                      "line": 22,
                    },
                  },
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "filename",
                      "position": {
                        "end": {
                          "column": 25,
                          "line": 24,
                        },
                        "start": {
                          "column": 8,
                          "line": 24,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "value",
                      "position": {
                        "end": {
                          "column": 39,
                          "line": 24,
                        },
                        "start": {
                          "column": 26,
                          "line": 24,
                        },
                      },
                      "type": "string",
                      "value": undefined,
                    },
                    {
                      "defaultValue": undefined,
                      "description": "Controls how types are rendered.",
                      "filePath": "test.ts",
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "Function",
                      "name": "children",
                      "position": {
                        "end": {
                          "column": 23,
                          "line": 19,
                        },
                        "start": {
                          "column": 3,
                          "line": 17,
                        },
                      },
                      "signatures": [
                        {
                          "kind": "FunctionSignature",
                          "modifier": undefined,
                          "parameters": [
                            {
                              "defaultValue": undefined,
                              "description": undefined,
                              "element": {
                                "filePath": "test.ts",
                                "kind": "Object",
                                "name": undefined,
                                "position": {
                                  "end": {
                                    "column": 6,
                                    "line": 11,
                                  },
                                  "start": {
                                    "column": 5,
                                    "line": 5,
                                  },
                                },
                                "properties": [
                                  {
                                    "defaultValue": undefined,
                                    "filePath": "test.ts",
                                    "isOptional": false,
                                    "isReadonly": false,
                                    "kind": "String",
                                    "name": "name",
                                    "position": {
                                      "end": {
                                        "column": 21,
                                        "line": 7,
                                      },
                                      "start": {
                                        "column": 7,
                                        "line": 7,
                                      },
                                    },
                                    "type": "string",
                                    "value": undefined,
                                  },
                                  {
                                    "defaultValue": undefined,
                                    "filePath": "test.ts",
                                    "isOptional": false,
                                    "isReadonly": false,
                                    "kind": "String",
                                    "name": "description",
                                    "position": {
                                      "end": {
                                        "column": 40,
                                        "line": 10,
                                      },
                                      "start": {
                                        "column": 7,
                                        "line": 10,
                                      },
                                    },
                                    "type": "string",
                                    "value": undefined,
                                  },
                                ],
                                "type": "{ name: string; description: string; }",
                              },
                              "filePath": "test.ts",
                              "isOptional": false,
                              "kind": "Array",
                              "name": "exportedTypes",
                              "position": {
                                "end": {
                                  "column": 55,
                                  "line": 18,
                                },
                                "start": {
                                  "column": 5,
                                  "line": 18,
                                },
                              },
                              "type": "Array<{ name: string; description: string; }>",
                            },
                          ],
                          "returnType": "ReactNode",
                          "type": "(exportedTypes: Array<{ name: string; description: string; }>) => ReactNode",
                        },
                      ],
                      "tags": undefined,
                      "type": "(exportedTypes: ReturnType<typeof getExportedTypes>) => React.ReactNode",
                    },
                  ],
                  "type": "{ filename: string; value: string; } & BaseExportedTypesProps",
                },
              ],
              "name": undefined,
              "position": {
                "end": {
                  "column": 56,
                  "line": 26,
                },
                "start": {
                  "column": 24,
                  "line": 26,
                },
              },
              "type": "ExportedTypesProps",
            },
            "returnType": "void",
            "type": "function ExportedTypes(ExportedTypesProps): void",
          },
        ],
        "type": "({ children }: ExportedTypesProps) => void",
      }
    `)
  })

  test('accepts mixed types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      export class Counter {
        count: number = 0;

        increment() {
          this.count++;
        }
      }

      export function useCounter() {
        const counter = new Counter();
        return counter;
      }
      `,
      { overwrite: true }
    )
    const nodes = Array.from(sourceFile.getExportedDeclarations()).map(
      ([, [declaration]]) => declaration
    ) as (FunctionDeclaration | ClassDeclaration)[]

    nodes
      .map((node) => getTypeDocumentation(node))
      .forEach((doc) => {
        if (doc.kind === 'Class') {
          doc.accessors
          // @ts-expect-error - should not have parameters
          doc.parameters
        }
        if (doc.kind === 'Function') {
          doc.signatures.at(0)!.parameters
          // @ts-expect-error - should not have accessors
          doc.accessors
        }
      })
  })

  test('printing imported node module union types', () => {
    project.createSourceFile(
      'node_modules/library/index.d.ts',
      dedent`
      export type InterfaceMetadata = {
        kind: 'Interface'
        name: string
      }
      `
    )

    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import type { InterfaceMetadata } from 'library'

      type TypeAliasMetadata = {
        kind: 'TypeAlias'
        name: string
      }

      type AllMetadata = InterfaceMetadata | TypeAliasMetadata
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getTypeAliasOrThrow('AllMetadata')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Union",
        "members": [
          {
            "filePath": "node_modules/library/index.d.ts",
            "kind": "Reference",
            "position": {
              "end": {
                "column": 2,
                "line": 4,
              },
              "start": {
                "column": 1,
                "line": 1,
              },
            },
            "type": "InterfaceMetadata",
          },
          {
            "filePath": "test.ts",
            "kind": "Object",
            "name": "TypeAliasMetadata",
            "position": {
              "end": {
                "column": 2,
                "line": 6,
              },
              "start": {
                "column": 1,
                "line": 3,
              },
            },
            "properties": [
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "kind",
                "position": {
                  "end": {
                    "column": 20,
                    "line": 4,
                  },
                  "start": {
                    "column": 3,
                    "line": 4,
                  },
                },
                "type": ""TypeAlias"",
                "value": "TypeAlias",
              },
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "name",
                "position": {
                  "end": {
                    "column": 15,
                    "line": 5,
                  },
                  "start": {
                    "column": 3,
                    "line": 5,
                  },
                },
                "type": "string",
                "value": undefined,
              },
            ],
            "type": "TypeAliasMetadata",
          },
        ],
        "name": "AllMetadata",
        "position": {
          "end": {
            "column": 57,
            "line": 8,
          },
          "start": {
            "column": 1,
            "line": 8,
          },
        },
        "type": "AllMetadata",
      }
    `)
  })

  test('variable declaration with primitive value', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      /**
       * The initial count of the counter.
       * @internal only for internal use
       */
      export const initialCount = 0
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('initialCount')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "description": "
      The initial count of the counter.",
        "filePath": "test.ts",
        "kind": "Number",
        "name": "initialCount",
        "position": {
          "end": {
            "column": 30,
            "line": 5,
          },
          "start": {
            "column": 14,
            "line": 5,
          },
        },
        "tags": [
          {
            "tagName": "internal",
            "text": "only for internal use",
          },
        ],
        "type": "0",
        "value": 0,
      }
    `)
  })

  test('variable declaration with "as const" object', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      export const colors = {
        primary: '#ff0000',
        secondary: '#00ff00',
        tertiary: '#0000ff'
      } as const
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('colors')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "colors",
        "position": {
          "end": {
            "column": 11,
            "line": 5,
          },
          "start": {
            "column": 14,
            "line": 1,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "primary",
            "position": {
              "end": {
                "column": 21,
                "line": 2,
              },
              "start": {
                "column": 3,
                "line": 2,
              },
            },
            "type": ""#ff0000"",
            "value": "#ff0000",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "secondary",
            "position": {
              "end": {
                "column": 23,
                "line": 3,
              },
              "start": {
                "column": 3,
                "line": 3,
              },
            },
            "type": ""#00ff00"",
            "value": "#00ff00",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "tertiary",
            "position": {
              "end": {
                "column": 22,
                "line": 4,
              },
              "start": {
                "column": 3,
                "line": 4,
              },
            },
            "type": ""#0000ff"",
            "value": "#0000ff",
          },
        ],
        "type": "{ readonly primary: "#ff0000"; readonly secondary: "#00ff00"; readonly tertiary: "#0000ff"; }",
      }
    `)
  })

  test('unknown initializers', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      class Counter {
        count: number = 0;
        increment() {
          this.count++;
        }
      }

      const counter = new Counter();
      const promise = new Promise<number>((resolve) => resolve(0));
      const awaited = await promise;
      `,
      { overwrite: true }
    )
    const counterTypes = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('counter')
    )
    const promiseTypes = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('promise')
    )
    const awaitedTypes = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('awaited')
    )

    expect({ counterTypes, promiseTypes, awaitedTypes }).toMatchInlineSnapshot(`
      {
        "awaitedTypes": {
          "filePath": "test.ts",
          "kind": "Number",
          "name": "awaited",
          "position": {
            "end": {
              "column": 30,
              "line": 10,
            },
            "start": {
              "column": 7,
              "line": 10,
            },
          },
          "type": "number",
          "value": undefined,
        },
        "counterTypes": {
          "filePath": "test.ts",
          "kind": "Class",
          "methods": [
            {
              "kind": "ClassMethod",
              "name": "increment",
              "scope": undefined,
              "signatures": [
                {
                  "kind": "FunctionSignature",
                  "modifier": undefined,
                  "parameters": [],
                  "returnType": "void",
                  "type": "() => void",
                },
              ],
              "type": "() => void",
              "visibility": undefined,
            },
          ],
          "name": "counter",
          "position": {
            "end": {
              "column": 30,
              "line": 8,
            },
            "start": {
              "column": 7,
              "line": 8,
            },
          },
          "properties": [
            {
              "defaultValue": 0,
              "filePath": "test.ts",
              "isReadonly": false,
              "kind": "Number",
              "name": "count",
              "position": {
                "end": {
                  "column": 21,
                  "line": 2,
                },
                "start": {
                  "column": 3,
                  "line": 2,
                },
              },
              "scope": undefined,
              "type": "number",
              "value": undefined,
              "visibility": undefined,
            },
          ],
          "type": "Counter",
        },
        "promiseTypes": {
          "arguments": [
            {
              "filePath": "node_modules/typescript/lib/lib.es5.d.ts",
              "kind": "Number",
              "name": undefined,
              "position": {
                "end": {
                  "column": 4943,
                  "line": 4,
                },
                "start": {
                  "column": 4755,
                  "line": 4,
                },
              },
              "type": "number",
              "value": undefined,
            },
          ],
          "filePath": "test.ts",
          "kind": "Generic",
          "name": "promise",
          "position": {
            "end": {
              "column": 61,
              "line": 9,
            },
            "start": {
              "column": 7,
              "line": 9,
            },
          },
          "type": "Promise<number>",
          "typeName": "Promise",
        },
      }
    `)
  })

  test('avoids printing primitives in computed-like generics', () => {
    const project = new Project()

    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type Compute<Type> = Type extends Function
        ? Type
        : {
            [Key in keyof Type]: Type[Key] extends object
              ? Compute<Type[Key]>
              : Type[Key]
          } & {}
      
      function getGitMetadata() {
        return undefined as unknown as { authors: string }
      }

      export type Module = Compute<{ authors?: string[] } & ReturnType<typeof getGitMetadata>>
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('Module')

    expect(() => getTypeDocumentation(typeAlias)).toThrow()
  })
})
