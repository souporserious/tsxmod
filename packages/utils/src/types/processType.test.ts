import { Project } from 'ts-morph'
import { processTypeProperties, processType } from './processType'
import dedent from 'dedent'

const project = new Project()

describe('processProperties', () => {
  const sourceFile = project.createSourceFile(
    'test.ts',
    `
  export type ExportedType = {
    slug: string;
    filePath: string;
  };

  export type ModuleData = {
    method(parameterValue: { objectValue: number }): Promise<number>;
    exportedTypes: Array<ExportedType>;
  };

  export type FunctionType = (param1: string, param2?: number) => Promise<ExportedType>;

  const foo = async () => {
    return {
      slug: 'foo',
      filePath: 'bar',
    }
  }

  export type ComplexType = {
    promiseObject?: Promise<ExportedType>;
    promiseFunction: Promise<(a: number, b: string) => void>;
    promiseVariable: ReturnType<typeof foo>;
    union: string | number;
    complexUnion: ((a: string) => string | number) | { a: string } | { b: number, c: (string | number)[] } | string;
    intersection: { a: string } & { b: number };
    complexIntersection: ReturnType<FunctionType> & { a: string } & { b(): void };
    tuple: [a: string, b: number, string];
    function: FunctionType;
  };
`
  )

  test('process generic properties', () => {
    const typeAlias = sourceFile.getTypeAliasOrThrow('ModuleData')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "ModuleData",
        "position": {
          "end": {
            "column": 5,
            "line": 10,
          },
          "start": {
            "column": 3,
            "line": 7,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Function",
            "name": "method",
            "position": {
              "end": {
                "column": 70,
                "line": 8,
              },
              "start": {
                "column": 5,
                "line": 8,
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
                    "name": "parameterValue",
                    "position": {
                      "end": {
                        "column": 51,
                        "line": 8,
                      },
                      "start": {
                        "column": 12,
                        "line": 8,
                      },
                    },
                    "properties": [
                      {
                        "defaultValue": undefined,
                        "filePath": "test.ts",
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "Number",
                        "name": "objectValue",
                        "position": {
                          "end": {
                            "column": 49,
                            "line": 8,
                          },
                          "start": {
                            "column": 30,
                            "line": 8,
                          },
                        },
                        "type": "number",
                      },
                    ],
                    "type": "{ objectValue: number; }",
                  },
                ],
                "returnType": "Promise<number>",
                "type": "(parameterValue: { objectValue: number; }) => Promise<number>",
              },
            ],
            "type": "(parameterValue: {    objectValue: number;}) => Promise<number>",
          },
          {
            "defaultValue": undefined,
            "element": {
              "filePath": "test.ts",
              "kind": "Reference",
              "position": {
                "end": {
                  "column": 5,
                  "line": 5,
                },
                "start": {
                  "column": 3,
                  "line": 2,
                },
              },
              "type": "ExportedType",
            },
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Array",
            "name": "exportedTypes",
            "position": {
              "end": {
                "column": 40,
                "line": 9,
              },
              "start": {
                "column": 5,
                "line": 9,
              },
            },
            "type": "Array<ExportedType>",
          },
        ],
        "type": "ModuleData",
      }
    `)
  })

  test('complex properties', () => {
    const typeAlias = sourceFile.getTypeAliasOrThrow('ComplexType')
    const type = typeAlias.getType()
    const processedProperties = processTypeProperties(type)

    expect(processedProperties).toMatchInlineSnapshot(`
      [
        {
          "arguments": [
            {
              "filePath": "test.ts",
              "kind": "Reference",
              "position": {
                "end": {
                  "column": 5,
                  "line": 5,
                },
                "start": {
                  "column": 3,
                  "line": 2,
                },
              },
              "type": "ExportedType",
            },
          ],
          "defaultValue": undefined,
          "filePath": "test.ts",
          "isOptional": true,
          "isReadonly": false,
          "kind": "Generic",
          "name": "promiseObject",
          "position": {
            "end": {
              "column": 43,
              "line": 22,
            },
            "start": {
              "column": 5,
              "line": 22,
            },
          },
          "type": "Promise<ExportedType>",
          "typeName": "Promise",
        },
        {
          "arguments": [
            {
              "filePath": "test.ts",
              "kind": "Function",
              "name": undefined,
              "position": {
                "end": {
                  "column": 60,
                  "line": 23,
                },
                "start": {
                  "column": 30,
                  "line": 23,
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
                          "column": 40,
                          "line": 23,
                        },
                        "start": {
                          "column": 31,
                          "line": 23,
                        },
                      },
                      "type": "number",
                    },
                    {
                      "defaultValue": undefined,
                      "description": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "kind": "String",
                      "name": "b",
                      "position": {
                        "end": {
                          "column": 51,
                          "line": 23,
                        },
                        "start": {
                          "column": 42,
                          "line": 23,
                        },
                      },
                      "type": "string",
                    },
                  ],
                  "returnType": "void",
                  "type": "(a: number, b: string) => void",
                },
              ],
              "type": "(a: number, b: string) => void",
            },
          ],
          "defaultValue": undefined,
          "filePath": "test.ts",
          "isOptional": false,
          "isReadonly": false,
          "kind": "Generic",
          "name": "promiseFunction",
          "position": {
            "end": {
              "column": 62,
              "line": 23,
            },
            "start": {
              "column": 5,
              "line": 23,
            },
          },
          "type": "Promise<(a: number, b: string) => void>",
          "typeName": "Promise",
        },
        {
          "arguments": [
            {
              "filePath": "test.ts",
              "kind": "Object",
              "name": undefined,
              "position": {
                "end": {
                  "column": 6,
                  "line": 18,
                },
                "start": {
                  "column": 12,
                  "line": 15,
                },
              },
              "properties": [
                {
                  "defaultValue": undefined,
                  "filePath": "test.ts",
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "String",
                  "name": "slug",
                  "position": {
                    "end": {
                      "column": 18,
                      "line": 16,
                    },
                    "start": {
                      "column": 7,
                      "line": 16,
                    },
                  },
                  "type": "string",
                },
                {
                  "defaultValue": undefined,
                  "filePath": "test.ts",
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "String",
                  "name": "filePath",
                  "position": {
                    "end": {
                      "column": 22,
                      "line": 17,
                    },
                    "start": {
                      "column": 7,
                      "line": 17,
                    },
                  },
                  "type": "string",
                },
              ],
              "type": "{ slug: string; filePath: string; }",
            },
          ],
          "defaultValue": undefined,
          "filePath": "test.ts",
          "isOptional": false,
          "isReadonly": false,
          "kind": "Generic",
          "name": "promiseVariable",
          "position": {
            "end": {
              "column": 45,
              "line": 24,
            },
            "start": {
              "column": 5,
              "line": 24,
            },
          },
          "type": "Promise<{ slug: string; filePath: string; }>",
          "typeName": "Promise",
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
              "kind": "String",
              "name": undefined,
              "position": {
                "end": {
                  "column": 28,
                  "line": 25,
                },
                "start": {
                  "column": 5,
                  "line": 25,
                },
              },
              "type": "string",
            },
            {
              "filePath": "test.ts",
              "kind": "Number",
              "name": undefined,
              "position": {
                "end": {
                  "column": 28,
                  "line": 25,
                },
                "start": {
                  "column": 5,
                  "line": 25,
                },
              },
              "type": "number",
            },
          ],
          "name": "union",
          "position": {
            "end": {
              "column": 28,
              "line": 25,
            },
            "start": {
              "column": 5,
              "line": 25,
            },
          },
          "type": "string | number",
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
              "kind": "String",
              "name": undefined,
              "position": {
                "end": {
                  "column": 117,
                  "line": 26,
                },
                "start": {
                  "column": 5,
                  "line": 26,
                },
              },
              "type": "string",
            },
            {
              "filePath": "test.ts",
              "kind": "Function",
              "name": undefined,
              "position": {
                "end": {
                  "column": 117,
                  "line": 26,
                },
                "start": {
                  "column": 5,
                  "line": 26,
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
                      "kind": "String",
                      "name": "a",
                      "position": {
                        "end": {
                          "column": 30,
                          "line": 26,
                        },
                        "start": {
                          "column": 21,
                          "line": 26,
                        },
                      },
                      "type": "string",
                    },
                  ],
                  "returnType": "string | number",
                  "type": "(a: string) => string | number",
                },
              ],
              "type": "(a: string) => string | number",
            },
            {
              "filePath": "test.ts",
              "kind": "Object",
              "name": undefined,
              "position": {
                "end": {
                  "column": 117,
                  "line": 26,
                },
                "start": {
                  "column": 5,
                  "line": 26,
                },
              },
              "properties": [
                {
                  "defaultValue": undefined,
                  "filePath": "test.ts",
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "String",
                  "name": "a",
                  "position": {
                    "end": {
                      "column": 65,
                      "line": 26,
                    },
                    "start": {
                      "column": 56,
                      "line": 26,
                    },
                  },
                  "type": "string",
                },
              ],
              "type": "{ a: string; }",
            },
            {
              "filePath": "test.ts",
              "kind": "Object",
              "name": undefined,
              "position": {
                "end": {
                  "column": 117,
                  "line": 26,
                },
                "start": {
                  "column": 5,
                  "line": 26,
                },
              },
              "properties": [
                {
                  "defaultValue": undefined,
                  "filePath": "test.ts",
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "Number",
                  "name": "b",
                  "position": {
                    "end": {
                      "column": 82,
                      "line": 26,
                    },
                    "start": {
                      "column": 72,
                      "line": 26,
                    },
                  },
                  "type": "number",
                },
                {
                  "defaultValue": undefined,
                  "element": {
                    "filePath": "node_modules/typescript/lib/lib.es5.d.ts",
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
                      },
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
                      },
                    ],
                    "name": undefined,
                    "position": {
                      "end": {
                        "column": 14214,
                        "line": 4,
                      },
                      "start": {
                        "column": 12443,
                        "line": 4,
                      },
                    },
                    "type": "string | number",
                  },
                  "filePath": "test.ts",
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "Array",
                  "name": "c",
                  "position": {
                    "end": {
                      "column": 105,
                      "line": 26,
                    },
                    "start": {
                      "column": 83,
                      "line": 26,
                    },
                  },
                  "type": "Array<string | number>",
                },
              ],
              "type": "{ b: number; c: (string | number)[]; }",
            },
          ],
          "name": "complexUnion",
          "position": {
            "end": {
              "column": 117,
              "line": 26,
            },
            "start": {
              "column": 5,
              "line": 26,
            },
          },
          "type": "string | ((a: string) => string | number) | { a: string; } | { b: number; c: (string | number)[]; }",
        },
        {
          "defaultValue": undefined,
          "filePath": "test.ts",
          "isOptional": false,
          "isReadonly": false,
          "kind": "Object",
          "name": "intersection",
          "position": {
            "end": {
              "column": 49,
              "line": 27,
            },
            "start": {
              "column": 5,
              "line": 27,
            },
          },
          "properties": [
            {
              "defaultValue": undefined,
              "filePath": "test.ts",
              "isOptional": false,
              "isReadonly": false,
              "kind": "String",
              "name": "a",
              "position": {
                "end": {
                  "column": 30,
                  "line": 27,
                },
                "start": {
                  "column": 21,
                  "line": 27,
                },
              },
              "type": "string",
            },
            {
              "defaultValue": undefined,
              "filePath": "test.ts",
              "isOptional": false,
              "isReadonly": false,
              "kind": "Number",
              "name": "b",
              "position": {
                "end": {
                  "column": 46,
                  "line": 27,
                },
                "start": {
                  "column": 37,
                  "line": 27,
                },
              },
              "type": "number",
            },
          ],
          "type": "{ a: string; } & { b: number; }",
        },
        {
          "defaultValue": undefined,
          "filePath": "test.ts",
          "isOptional": false,
          "isReadonly": false,
          "kind": "Intersection",
          "name": "complexIntersection",
          "position": {
            "end": {
              "column": 83,
              "line": 28,
            },
            "start": {
              "column": 5,
              "line": 28,
            },
          },
          "properties": [
            {
              "arguments": [
                {
                  "filePath": "test.ts",
                  "kind": "Reference",
                  "position": {
                    "end": {
                      "column": 5,
                      "line": 5,
                    },
                    "start": {
                      "column": 3,
                      "line": 2,
                    },
                  },
                  "type": "ExportedType",
                },
              ],
              "filePath": "test.ts",
              "kind": "Generic",
              "name": undefined,
              "position": {
                "end": {
                  "column": 83,
                  "line": 28,
                },
                "start": {
                  "column": 5,
                  "line": 28,
                },
              },
              "type": "Promise<ExportedType>",
              "typeName": "Promise",
            },
            {
              "defaultValue": undefined,
              "filePath": "test.ts",
              "isOptional": false,
              "isReadonly": false,
              "kind": "String",
              "name": "a",
              "position": {
                "end": {
                  "column": 64,
                  "line": 28,
                },
                "start": {
                  "column": 55,
                  "line": 28,
                },
              },
              "type": "string",
            },
            {
              "defaultValue": undefined,
              "filePath": "test.ts",
              "isOptional": false,
              "isReadonly": false,
              "kind": "Function",
              "name": "b",
              "position": {
                "end": {
                  "column": 80,
                  "line": 28,
                },
                "start": {
                  "column": 71,
                  "line": 28,
                },
              },
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
            },
          ],
          "type": "Promise<ExportedType> & { a: string; } & { b(): void; }",
        },
        {
          "defaultValue": undefined,
          "elements": [
            {
              "filePath": "test.ts",
              "kind": "String",
              "name": "a",
              "position": {
                "end": {
                  "column": 43,
                  "line": 29,
                },
                "start": {
                  "column": 5,
                  "line": 29,
                },
              },
              "type": "string",
            },
            {
              "filePath": "test.ts",
              "kind": "Number",
              "name": "b",
              "position": {
                "end": {
                  "column": 43,
                  "line": 29,
                },
                "start": {
                  "column": 5,
                  "line": 29,
                },
              },
              "type": "number",
            },
            {
              "filePath": "test.ts",
              "kind": "String",
              "name": "string",
              "position": {
                "end": {
                  "column": 43,
                  "line": 29,
                },
                "start": {
                  "column": 5,
                  "line": 29,
                },
              },
              "type": "string",
            },
          ],
          "filePath": "test.ts",
          "isOptional": false,
          "isReadonly": false,
          "kind": "Tuple",
          "name": "tuple",
          "position": {
            "end": {
              "column": 43,
              "line": 29,
            },
            "start": {
              "column": 5,
              "line": 29,
            },
          },
          "type": "[a: string, b: number, string]",
        },
        {
          "defaultValue": undefined,
          "filePath": "test.ts",
          "isOptional": false,
          "isReadonly": false,
          "kind": "Function",
          "name": "function",
          "position": {
            "end": {
              "column": 28,
              "line": 30,
            },
            "start": {
              "column": 5,
              "line": 30,
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
                  "kind": "String",
                  "name": "param1",
                  "position": {
                    "end": {
                      "column": 45,
                      "line": 12,
                    },
                    "start": {
                      "column": 31,
                      "line": 12,
                    },
                  },
                  "type": "string",
                },
                {
                  "defaultValue": undefined,
                  "description": undefined,
                  "filePath": "test.ts",
                  "isOptional": true,
                  "kind": "Number",
                  "name": "param2",
                  "position": {
                    "end": {
                      "column": 62,
                      "line": 12,
                    },
                    "start": {
                      "column": 47,
                      "line": 12,
                    },
                  },
                  "type": "number",
                },
              ],
              "returnType": "Promise<ExportedType>",
              "type": "(param1: string, param2?: number) => Promise<ExportedType>",
            },
          ],
          "type": "FunctionType",
        },
      ]
    `)
  })

  test('intersection and union', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      export type BaseVariant = {
        color: string;
      }

      type FillVariant = {
        backgroundColor: string;
      } & BaseVariant

      type OutlineVariant = {
        borderColor: string;
      } & BaseVariant

      type Variant<T> = FillVariant | OutlineVariant | string;
    `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('Variant')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
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
          },
          {
            "filePath": "test.ts",
            "kind": "Intersection",
            "name": "FillVariant",
            "position": {
              "end": {
                "column": 22,
                "line": 8,
              },
              "start": {
                "column": 7,
                "line": 6,
              },
            },
            "properties": [
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "backgroundColor",
                "position": {
                  "end": {
                    "column": 33,
                    "line": 7,
                  },
                  "start": {
                    "column": 9,
                    "line": 7,
                  },
                },
                "type": "string",
              },
              {
                "filePath": "test.ts",
                "kind": "Reference",
                "position": {
                  "end": {
                    "column": 8,
                    "line": 4,
                  },
                  "start": {
                    "column": 7,
                    "line": 2,
                  },
                },
                "type": "BaseVariant",
              },
            ],
            "type": "FillVariant",
          },
          {
            "filePath": "test.ts",
            "kind": "Intersection",
            "name": "OutlineVariant",
            "position": {
              "end": {
                "column": 22,
                "line": 12,
              },
              "start": {
                "column": 7,
                "line": 10,
              },
            },
            "properties": [
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "borderColor",
                "position": {
                  "end": {
                    "column": 29,
                    "line": 11,
                  },
                  "start": {
                    "column": 9,
                    "line": 11,
                  },
                },
                "type": "string",
              },
              {
                "filePath": "test.ts",
                "kind": "Reference",
                "position": {
                  "end": {
                    "column": 8,
                    "line": 4,
                  },
                  "start": {
                    "column": 7,
                    "line": 2,
                  },
                },
                "type": "BaseVariant",
              },
            ],
            "type": "OutlineVariant",
          },
        ],
        "name": "Variant",
        "position": {
          "end": {
            "column": 63,
            "line": 14,
          },
          "start": {
            "column": 7,
            "line": 14,
          },
        },
        "type": "Variant<T>",
      }
    `)
  })

  test('primitives', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      type Primitives = {
        /** a string */
        str: string;
        
        /**
         * a number
         * @internal
         */
        num: number;
        
        bool: boolean;
        
        arr: string[];
        
        /* non js doc */
        obj: Record<string, { value: number }>;
        
        /** Accepts a string */
        func: (
          /** a string parameter */
          a: string,
        ) => void;

        asyncFunc: typeof foo;
      }

      async function foo() {}
    `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('Primitives')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "Primitives",
        "position": {
          "end": {
            "column": 8,
            "line": 26,
          },
          "start": {
            "column": 7,
            "line": 2,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "description": "a string",
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "String",
            "name": "str",
            "position": {
              "end": {
                "column": 21,
                "line": 4,
              },
              "start": {
                "column": 9,
                "line": 4,
              },
            },
            "tags": undefined,
            "type": "string",
          },
          {
            "defaultValue": undefined,
            "description": "
      a number",
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Number",
            "name": "num",
            "position": {
              "end": {
                "column": 21,
                "line": 10,
              },
              "start": {
                "column": 9,
                "line": 10,
              },
            },
            "tags": [
              {
                "tagName": "internal",
                "text": undefined,
              },
            ],
            "type": "number",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Boolean",
            "name": "bool",
            "position": {
              "end": {
                "column": 23,
                "line": 12,
              },
              "start": {
                "column": 9,
                "line": 12,
              },
            },
            "type": "boolean",
          },
          {
            "defaultValue": undefined,
            "element": {
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
            },
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Array",
            "name": "arr",
            "position": {
              "end": {
                "column": 23,
                "line": 14,
              },
              "start": {
                "column": 9,
                "line": 14,
              },
            },
            "type": "Array<string>",
          },
          {
            "arguments": [
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
              },
              {
                "filePath": "test.ts",
                "kind": "Object",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 46,
                    "line": 17,
                  },
                  "start": {
                    "column": 29,
                    "line": 17,
                  },
                },
                "properties": [
                  {
                    "defaultValue": undefined,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "value",
                    "position": {
                      "end": {
                        "column": 44,
                        "line": 17,
                      },
                      "start": {
                        "column": 31,
                        "line": 17,
                      },
                    },
                    "type": "number",
                  },
                ],
                "type": "{ value: number; }",
              },
            ],
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "obj",
            "position": {
              "end": {
                "column": 48,
                "line": 17,
              },
              "start": {
                "column": 9,
                "line": 17,
              },
            },
            "type": "Record<string, { value: number; }>",
            "typeName": "Record",
          },
          {
            "defaultValue": undefined,
            "description": "Accepts a string",
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Function",
            "name": "func",
            "position": {
              "end": {
                "column": 19,
                "line": 23,
              },
              "start": {
                "column": 9,
                "line": 20,
              },
            },
            "signatures": [
              {
                "kind": "FunctionSignature",
                "modifier": undefined,
                "parameters": [
                  {
                    "defaultValue": undefined,
                    "description": "a string parameter",
                    "filePath": "test.ts",
                    "isOptional": false,
                    "kind": "String",
                    "name": "a",
                    "position": {
                      "end": {
                        "column": 20,
                        "line": 22,
                      },
                      "start": {
                        "column": 11,
                        "line": 22,
                      },
                    },
                    "type": "string",
                  },
                ],
                "returnType": "void",
                "type": "(a: string) => void",
              },
            ],
            "tags": undefined,
            "type": "(a: string) => void",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Function",
            "name": "asyncFunc",
            "position": {
              "end": {
                "column": 31,
                "line": 25,
              },
              "start": {
                "column": 9,
                "line": 25,
              },
            },
            "signatures": [
              {
                "kind": "FunctionSignature",
                "modifier": "async",
                "parameters": [],
                "returnType": "Promise<void>",
                "type": "function foo(): Promise<void>",
              },
            ],
            "type": "() => Promise<void>",
          },
        ],
        "type": "Primitives",
      }
    `)
  })

  test('variable declarations', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      const a = {
        b: 1,
        c: 'string',
        ...d
      } as const

      const d = {
        e: {
          f: 1,
        },
        g: 'string',
      }
    `,
      { overwrite: true }
    )
    const variableDeclaration = sourceFile.getVariableDeclarationOrThrow('a')
    const processedProperties = processType(
      variableDeclaration.getType(),
      variableDeclaration
    )

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "a",
        "position": {
          "end": {
            "column": 17,
            "line": 6,
          },
          "start": {
            "column": 13,
            "line": 2,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": true,
            "kind": "Object",
            "name": "e",
            "position": {
              "end": {
                "column": 10,
                "line": 11,
              },
              "start": {
                "column": 9,
                "line": 9,
              },
            },
            "properties": [
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "Number",
                "name": "f",
                "position": {
                  "end": {
                    "column": 15,
                    "line": 10,
                  },
                  "start": {
                    "column": 11,
                    "line": 10,
                  },
                },
                "type": "number",
              },
            ],
            "type": "{ f: number; }",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "g",
            "position": {
              "end": {
                "column": 20,
                "line": 12,
              },
              "start": {
                "column": 9,
                "line": 12,
              },
            },
            "type": "string",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": true,
            "kind": "Number",
            "name": "b",
            "position": {
              "end": {
                "column": 13,
                "line": 3,
              },
              "start": {
                "column": 9,
                "line": 3,
              },
            },
            "type": "1",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "c",
            "position": {
              "end": {
                "column": 20,
                "line": 4,
              },
              "start": {
                "column": 9,
                "line": 4,
              },
            },
            "type": ""string"",
          },
        ],
        "type": "{ readonly e: { f: number; }; readonly g: string; readonly b: 1; readonly c: "string"; }",
      }
    `)
  })

  test('recursive types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      type SelfReferencedType = {
        id: string;
        children: SelfReferencedType[];
      }
    `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('SelfReferencedType')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "SelfReferencedType",
        "position": {
          "end": {
            "column": 8,
            "line": 5,
          },
          "start": {
            "column": 7,
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
            "name": "id",
            "position": {
              "end": {
                "column": 20,
                "line": 3,
              },
              "start": {
                "column": 9,
                "line": 3,
              },
            },
            "type": "string",
          },
          {
            "defaultValue": undefined,
            "element": {
              "filePath": "test.ts",
              "kind": "Reference",
              "position": {
                "end": {
                  "column": 8,
                  "line": 5,
                },
                "start": {
                  "column": 7,
                  "line": 2,
                },
              },
              "type": "SelfReferencedType",
            },
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Array",
            "name": "children",
            "position": {
              "end": {
                "column": 40,
                "line": 4,
              },
              "start": {
                "column": 9,
                "line": 4,
              },
            },
            "type": "Array<SelfReferencedType>",
          },
        ],
        "type": "SelfReferencedType",
      }
    `)
  })

  test('references property signature types located in node_modules', () => {
    const project = new Project()

    project.createSourceFile(
      'node_modules/@types/library/index.d.ts',
      dedent`
      export function readFile(path: string, callback: (err: Error | null, data: Buffer) => void): void;
      `
    )

    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      import { readFile } from 'library';

      type FileSystem = { readFile: typeof readFile };
      `
    )

    const typeAlias = sourceFile.getTypeAliasOrThrow('FileSystem')
    const processedProperties = processType(typeAlias.getType(), typeAlias)

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "FileSystem",
        "position": {
          "end": {
            "column": 55,
            "line": 4,
          },
          "start": {
            "column": 7,
            "line": 4,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Reference",
            "name": "readFile",
            "position": {
              "end": {
                "column": 52,
                "line": 4,
              },
              "start": {
                "column": 27,
                "line": 4,
              },
            },
            "type": "(path: string, callback: (err: Error, data: Buffer) => void) => void",
          },
        ],
        "type": "FileSystem",
      }
    `)
  })

  test('avoids analyzing prototype properties and methods', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type Foo = {
        bar: 'baz'
      }
      
      type AsyncString = {
        value: Promise<Foo>
      }
      `,
      { overwrite: true }
    )

    const typeAlias = sourceFile.getTypeAliasOrThrow('AsyncString')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "AsyncString",
        "position": {
          "end": {
            "column": 2,
            "line": 7,
          },
          "start": {
            "column": 1,
            "line": 5,
          },
        },
        "properties": [
          {
            "arguments": [
              {
                "filePath": "test.ts",
                "kind": "Object",
                "name": "Foo",
                "position": {
                  "end": {
                    "column": 2,
                    "line": 3,
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
                    "name": "bar",
                    "position": {
                      "end": {
                        "column": 13,
                        "line": 2,
                      },
                      "start": {
                        "column": 3,
                        "line": 2,
                      },
                    },
                    "type": ""baz"",
                  },
                ],
                "type": "Foo",
              },
            ],
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "value",
            "position": {
              "end": {
                "column": 22,
                "line": 6,
              },
              "start": {
                "column": 3,
                "line": 6,
              },
            },
            "type": "Promise<Foo>",
            "typeName": "Promise",
          },
        ],
        "type": "AsyncString",
      }
    `)
  })

  test('unwraps generic types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type DistributiveOmit<T, K extends PropertyKey> = T extends any
        ? Omit<T, K>
        : never

      type BaseType = {
        url: string
        title: string
      }

      type A = {
        a: Promise<number>
      } & BaseType

      type B = {
        b: number
      } & BaseType

      type UnionType = A | B

      type UnwrapPromisesInMap<T> = {
        [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K]
      }

      type ExportedType = UnwrapPromisesInMap<DistributiveOmit<UnionType, 'title'>>
      `,
      { overwrite: true }
    )

    const typeAlias = sourceFile.getTypeAliasOrThrow('ExportedType')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Union",
        "members": [
          {
            "filePath": "test.ts",
            "kind": "Object",
            "name": "UnwrapPromisesInMap",
            "position": {
              "end": {
                "column": 2,
                "line": 22,
              },
              "start": {
                "column": 1,
                "line": 20,
              },
            },
            "properties": [
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "Number",
                "name": "a",
                "position": {
                  "end": {
                    "column": 21,
                    "line": 11,
                  },
                  "start": {
                    "column": 3,
                    "line": 11,
                  },
                },
                "type": "number",
              },
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "url",
                "position": {
                  "end": {
                    "column": 14,
                    "line": 6,
                  },
                  "start": {
                    "column": 3,
                    "line": 6,
                  },
                },
                "type": "string",
              },
            ],
            "type": "UnwrapPromisesInMap<Omit<A, "title">>",
          },
          {
            "filePath": "test.ts",
            "kind": "Object",
            "name": "UnwrapPromisesInMap",
            "position": {
              "end": {
                "column": 2,
                "line": 22,
              },
              "start": {
                "column": 1,
                "line": 20,
              },
            },
            "properties": [
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "url",
                "position": {
                  "end": {
                    "column": 14,
                    "line": 6,
                  },
                  "start": {
                    "column": 3,
                    "line": 6,
                  },
                },
                "type": "string",
              },
              {
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "Number",
                "name": "b",
                "position": {
                  "end": {
                    "column": 12,
                    "line": 15,
                  },
                  "start": {
                    "column": 3,
                    "line": 15,
                  },
                },
                "type": "number",
              },
            ],
            "type": "UnwrapPromisesInMap<Omit<B, "title">>",
          },
        ],
        "name": "ExportedType",
        "position": {
          "end": {
            "column": 78,
            "line": 24,
          },
          "start": {
            "column": 1,
            "line": 24,
          },
        },
        "type": "ExportedType",
      }
    `)
  })

  test('creates reference for external types', () => {
    const project = new Project()

    project.createSourceFile(
      './library/index.d.ts',
      dedent`
      export type Color = 'red' | 'blue' | 'green';
      `
    )

    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import { Color } from './library';

      export type TextProps = {
        color: Color
      }
      `,
      { overwrite: true }
    )
    const types = processType(
      sourceFile.getTypeAliasOrThrow('TextProps').getType()
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "TextProps",
        "position": {
          "end": {
            "column": 2,
            "line": 5,
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
            "kind": "Reference",
            "name": "color",
            "position": {
              "end": {
                "column": 15,
                "line": 4,
              },
              "start": {
                "column": 3,
                "line": 4,
              },
            },
            "type": "Color",
          },
        ],
        "type": "TextProps",
      }
    `)
  })

  test('creates reference for virtual types pointing to node modules', () => {
    const project = new Project()

    project.createSourceFile(
      'node_modules/@types/library/index.d.ts',
      dedent`
      export type Color = 'red' | 'blue' | 'green';
      `
    )

    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import type { Color } from 'library';

      export type DropDollarPrefix<T> = {
        [K in keyof T as K extends \`$\${infer I}\` ? I : K]: T[K]
      }
      
      type StyledTextProps = {
        $color?: Color
      }
      
      export type TextProps = {
        fontWeight?: string | number
      } & DropDollarPrefix<StyledTextProps>
      `,
      { overwrite: true }
    )
    const types = processType(
      sourceFile.getTypeAliasOrThrow('TextProps').getType()
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "TextProps",
        "position": {
          "end": {
            "column": 38,
            "line": 13,
          },
          "start": {
            "column": 1,
            "line": 11,
          },
        },
        "properties": [
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
                    "column": 31,
                    "line": 12,
                  },
                  "start": {
                    "column": 3,
                    "line": 12,
                  },
                },
                "type": "string",
              },
              {
                "filePath": "test.ts",
                "kind": "Number",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 31,
                    "line": 12,
                  },
                  "start": {
                    "column": 3,
                    "line": 12,
                  },
                },
                "type": "number",
              },
            ],
            "name": "fontWeight",
            "position": {
              "end": {
                "column": 31,
                "line": 12,
              },
              "start": {
                "column": 3,
                "line": 12,
              },
            },
            "type": "string | number",
          },
          {
            "defaultValue": undefined,
            "filePath": "node_modules/@types/library/index.d.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Reference",
            "name": "color",
            "position": {
              "end": {
                "column": 46,
                "line": 1,
              },
              "start": {
                "column": 1,
                "line": 1,
              },
            },
            "type": "Color",
          },
        ],
        "type": "TextProps",
      }
    `)
  })

  test('simplifies complex generic types', () => {
    const project = new Project()

    project.createSourceFile(
      'node_modules/@types/library/index.d.ts',
      dedent`
      interface SharedMetadata {
        name: string;
      }

      export interface FunctionMetadata extends SharedMetadata {
        parameters: Array<PropertyMetadata>;
      }

      export interface TypeMetadata extends SharedMetadata {
        properties: Array<PropertyMetadata>;
      }

      export interface PropertyMetadata extends SharedMetadata {
        type: string;
      }

      export type Metadata = FunctionMetadata | TypeMetadata;
      `
    )

    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import type { Metadata } from 'library';

      type ExportedType = Metadata & { slug: string }

      type ModuleData<Type extends { frontMatter: Record<string, any> }> = {
        exportedTypes: Array<ExportedType>
      }
      `,
      { overwrite: true }
    )
    const types = processType(
      sourceFile.getTypeAliasOrThrow('ModuleData').getType()
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "ModuleData",
        "position": {
          "end": {
            "column": 2,
            "line": 7,
          },
          "start": {
            "column": 1,
            "line": 5,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "element": {
              "filePath": "test.ts",
              "kind": "Union",
              "members": [
                {
                  "filePath": "test.ts",
                  "kind": "Intersection",
                  "name": undefined,
                  "position": {
                    "end": {
                      "column": 48,
                      "line": 3,
                    },
                    "start": {
                      "column": 1,
                      "line": 3,
                    },
                  },
                  "properties": [
                    {
                      "filePath": "node_modules/@types/library/index.d.ts",
                      "kind": "Reference",
                      "position": {
                        "end": {
                          "column": 2,
                          "line": 7,
                        },
                        "start": {
                          "column": 1,
                          "line": 5,
                        },
                      },
                      "type": "FunctionMetadata",
                    },
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "slug",
                      "position": {
                        "end": {
                          "column": 46,
                          "line": 3,
                        },
                        "start": {
                          "column": 34,
                          "line": 3,
                        },
                      },
                      "type": "string",
                    },
                  ],
                  "type": "FunctionMetadata & { slug: string; }",
                },
                {
                  "filePath": "test.ts",
                  "kind": "Intersection",
                  "name": undefined,
                  "position": {
                    "end": {
                      "column": 48,
                      "line": 3,
                    },
                    "start": {
                      "column": 1,
                      "line": 3,
                    },
                  },
                  "properties": [
                    {
                      "filePath": "node_modules/@types/library/index.d.ts",
                      "kind": "Reference",
                      "position": {
                        "end": {
                          "column": 2,
                          "line": 11,
                        },
                        "start": {
                          "column": 1,
                          "line": 9,
                        },
                      },
                      "type": "TypeMetadata",
                    },
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "slug",
                      "position": {
                        "end": {
                          "column": 46,
                          "line": 3,
                        },
                        "start": {
                          "column": 34,
                          "line": 3,
                        },
                      },
                      "type": "string",
                    },
                  ],
                  "type": "TypeMetadata & { slug: string; }",
                },
              ],
              "name": "ExportedType",
              "position": {
                "end": {
                  "column": 48,
                  "line": 3,
                },
                "start": {
                  "column": 1,
                  "line": 3,
                },
              },
              "type": "ExportedType",
            },
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Array",
            "name": "exportedTypes",
            "position": {
              "end": {
                "column": 37,
                "line": 6,
              },
              "start": {
                "column": 3,
                "line": 6,
              },
            },
            "type": "Array<ExportedType>",
          },
        ],
        "type": "ModuleData<Type>",
      }
    `)
  })

  test('function arguments that reference exported types', () => {
    const project = new Project()

    project.createSourceFile(
      'node_modules/@types/library/index.d.ts',
      dedent`
      export type Color = 'red' | 'blue' | 'green';
      `
    )

    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import type { Color } from 'library';

      export type Text = (color: Color) => void
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('Text')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "Text",
        "position": {
          "end": {
            "column": 42,
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
                "kind": "Reference",
                "name": "color",
                "position": {
                  "end": {
                    "column": 33,
                    "line": 3,
                  },
                  "start": {
                    "column": 21,
                    "line": 3,
                  },
                },
                "type": "Color",
              },
            ],
            "returnType": "void",
            "type": "(color: Color) => void",
          },
        ],
        "type": "Text",
      }
    `)
  })

  test('function arguments that reference interfaces', () => {
    const project = new Project()

    project.createSourceFile(
      'node_modules/@types/library/index.d.ts',
      dedent`
      export type Color = 'red' | 'blue' | 'green';
      `
    )

    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import type { Color } from 'library';

      interface TextProps {
        color: Color;
      }
      
      export function Text(props?: TextProps) {}
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getFunctionOrThrow('Text')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Component",
        "name": "Text",
        "position": {
          "end": {
            "column": 43,
            "line": 7,
          },
          "start": {
            "column": 1,
            "line": 7,
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
              "isOptional": true,
              "kind": "Object",
              "name": "props",
              "position": {
                "end": {
                  "column": 39,
                  "line": 7,
                },
                "start": {
                  "column": 22,
                  "line": 7,
                },
              },
              "properties": [
                {
                  "defaultValue": undefined,
                  "filePath": "test.ts",
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "Reference",
                  "name": "color",
                  "position": {
                    "end": {
                      "column": 16,
                      "line": 4,
                    },
                    "start": {
                      "column": 3,
                      "line": 4,
                    },
                  },
                  "type": "Color",
                },
              ],
              "type": "TextProps",
            },
            "returnType": "void",
            "type": "function Text(props?: TextProps): void",
          },
        ],
        "type": "(props?: TextProps) => void",
      }
    `)
  })

  test('function arguments create reference to exported type aliases', () => {
    const project = new Project()

    project.createSourceFile(
      'node_modules/@types/library/index.d.ts',
      dedent`
      export type Color = 'red' | 'blue' | 'green';
      `
    )

    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import type { Color } from 'library';

      export type TextProps = {
        fontWeight: number;
        color: Color;
      }
      
      export type Text = (props: TextProps) => void
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('Text')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "Text",
        "position": {
          "end": {
            "column": 46,
            "line": 8,
          },
          "start": {
            "column": 1,
            "line": 8,
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
                "kind": "Reference",
                "name": "props",
                "position": {
                  "end": {
                    "column": 37,
                    "line": 8,
                  },
                  "start": {
                    "column": 21,
                    "line": 8,
                  },
                },
                "type": "TextProps",
              },
            ],
            "returnType": "void",
            "type": "(props: TextProps) => void",
          },
        ],
        "type": "Text",
      }
    `)
  })

  test('default parameter values', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      export type TextProps = {
        color: string;
        fontSize?: number;
      }

      export function Text(props: TextProps = { color: 'red' }) {}
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getFunctionOrThrow('Text')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": "Text",
        "position": {
          "end": {
            "column": 61,
            "line": 6,
          },
          "start": {
            "column": 1,
            "line": 6,
          },
        },
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": {
                  "color": "red",
                },
                "description": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "kind": "Reference",
                "name": "props",
                "position": {
                  "end": {
                    "column": 57,
                    "line": 6,
                  },
                  "start": {
                    "column": 22,
                    "line": 6,
                  },
                },
                "type": "TextProps",
              },
            ],
            "returnType": "void",
            "type": "function Text(props: TextProps): void",
          },
        ],
        "type": "(props?: TextProps) => void",
      }
    `)
  })

  test('default object values', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type TextProps = {
        style: {
          fontSize: number;
          fontWeight: number;
          color?: string;
        };
      }

      export function Text({ style: { fontSize, color } }: TextProps = { style: { fontWeight: 400, color: 'blue' } }) {}
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getFunctionOrThrow('Text')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Component",
        "name": "Text",
        "position": {
          "end": {
            "column": 115,
            "line": 9,
          },
          "start": {
            "column": 1,
            "line": 9,
          },
        },
        "signatures": [
          {
            "kind": "ComponentSignature",
            "modifier": undefined,
            "properties": {
              "defaultValue": {
                "style": {
                  "color": "blue",
                  "fontWeight": 400,
                },
              },
              "description": undefined,
              "filePath": "test.ts",
              "isOptional": false,
              "kind": "Object",
              "name": undefined,
              "position": {
                "end": {
                  "column": 111,
                  "line": 9,
                },
                "start": {
                  "column": 22,
                  "line": 9,
                },
              },
              "properties": [
                {
                  "defaultValue": {
                    "color": "blue",
                    "fontWeight": 400,
                  },
                  "filePath": "test.ts",
                  "isOptional": true,
                  "isReadonly": false,
                  "kind": "Object",
                  "name": "style",
                  "position": {
                    "end": {
                      "column": 5,
                      "line": 6,
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
                      "kind": "Number",
                      "name": "fontSize",
                      "position": {
                        "end": {
                          "column": 22,
                          "line": 3,
                        },
                        "start": {
                          "column": 5,
                          "line": 3,
                        },
                      },
                      "type": "number",
                    },
                    {
                      "defaultValue": 400,
                      "filePath": "test.ts",
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "Number",
                      "name": "fontWeight",
                      "position": {
                        "end": {
                          "column": 24,
                          "line": 4,
                        },
                        "start": {
                          "column": 5,
                          "line": 4,
                        },
                      },
                      "type": "number",
                    },
                    {
                      "defaultValue": "blue",
                      "filePath": "test.ts",
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "color",
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
                    },
                  ],
                  "type": "{ fontSize: number; fontWeight: number; color?: string; }",
                },
              ],
              "type": "TextProps",
            },
            "returnType": "void",
            "type": "function Text(TextProps): void",
          },
        ],
        "type": "({ style: { fontSize, color } }?: TextProps) => void",
      }
    `)
  })

  test('conditional generic', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type ModuleData<Type extends { frontMatter: Record<string, any> }> = 'frontMatter' extends keyof Type
          ? Type
          : { frontMatter: Record<string, any> }
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('ModuleData')
    const types = processType(typeAlias.getType(), typeAlias)

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
                "column": 43,
                "line": 3,
              },
              "start": {
                "column": 7,
                "line": 3,
              },
            },
            "properties": [
              {
                "arguments": [
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
                  },
                  {
                    "filePath": "node_modules/typescript/lib/lib.es5.d.ts",
                    "kind": "Primitive",
                    "position": {
                      "end": {
                        "column": 315,
                        "line": 6,
                      },
                      "start": {
                        "column": 266,
                        "line": 6,
                      },
                    },
                    "type": "any",
                  },
                ],
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "Generic",
                "name": "frontMatter",
                "position": {
                  "end": {
                    "column": 41,
                    "line": 3,
                  },
                  "start": {
                    "column": 9,
                    "line": 3,
                  },
                },
                "type": "Record<string, any>",
                "typeName": "Record",
              },
            ],
            "type": "{ frontMatter: Record<string, any>; }",
          },
          {
            "filePath": "test.ts",
            "kind": "Object",
            "name": undefined,
            "position": {
              "end": {
                "column": 66,
                "line": 1,
              },
              "start": {
                "column": 30,
                "line": 1,
              },
            },
            "properties": [
              {
                "arguments": [
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
                  },
                  {
                    "filePath": "node_modules/typescript/lib/lib.es5.d.ts",
                    "kind": "Primitive",
                    "position": {
                      "end": {
                        "column": 315,
                        "line": 6,
                      },
                      "start": {
                        "column": 266,
                        "line": 6,
                      },
                    },
                    "type": "any",
                  },
                ],
                "defaultValue": undefined,
                "filePath": "test.ts",
                "isOptional": false,
                "isReadonly": false,
                "kind": "Generic",
                "name": "frontMatter",
                "position": {
                  "end": {
                    "column": 64,
                    "line": 1,
                  },
                  "start": {
                    "column": 32,
                    "line": 1,
                  },
                },
                "type": "Record<string, any>",
                "typeName": "Record",
              },
            ],
            "type": "{ frontMatter: Record<string, any>; }",
          },
        ],
        "name": undefined,
        "position": {
          "end": {
            "column": 43,
            "line": 3,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "type": "{ frontMatter: Record<string, any>; } | { frontMatter: Record<string, any>; }",
      }
    `)
  })

  test('generic function parameters', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      const createComponent = (
        <Props extends Record<string, any>>(tagName: string) => (props: Props) => {}
      )
      
      type GridProps = { columns: number, rows: number }
      
      const Grid = createComponent<GridProps>('div')
      `,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getVariableDeclarationOrThrow('Grid')
    const processedProperties = processType(functionDeclaration.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Function",
        "name": undefined,
        "position": {
          "end": {
            "column": 79,
            "line": 2,
          },
          "start": {
            "column": 59,
            "line": 2,
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
                "name": "props",
                "position": {
                  "end": {
                    "column": 72,
                    "line": 2,
                  },
                  "start": {
                    "column": 60,
                    "line": 2,
                  },
                },
                "properties": [
                  {
                    "defaultValue": undefined,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "columns",
                    "position": {
                      "end": {
                        "column": 36,
                        "line": 5,
                      },
                      "start": {
                        "column": 20,
                        "line": 5,
                      },
                    },
                    "type": "number",
                  },
                  {
                    "defaultValue": undefined,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "rows",
                    "position": {
                      "end": {
                        "column": 49,
                        "line": 5,
                      },
                      "start": {
                        "column": 37,
                        "line": 5,
                      },
                    },
                    "type": "number",
                  },
                ],
                "type": "GridProps",
              },
            ],
            "returnType": "void",
            "type": "(props: GridProps) => void",
          },
        ],
        "type": "(props: GridProps) => void",
      }
    `)
  })

  test('explicit undefined is a union', () => {
    const project = new Project({
      compilerOptions: {
        strictNullChecks: true,
      },
    })
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type TextProps = {
        color: string | undefined;
      }
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('TextProps')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "TextProps",
        "position": {
          "end": {
            "column": 2,
            "line": 3,
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
                "kind": "Primitive",
                "position": {
                  "end": {
                    "column": 29,
                    "line": 2,
                  },
                  "start": {
                    "column": 3,
                    "line": 2,
                  },
                },
                "type": "undefined",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 29,
                    "line": 2,
                  },
                  "start": {
                    "column": 3,
                    "line": 2,
                  },
                },
                "type": "string",
              },
            ],
            "name": "color",
            "position": {
              "end": {
                "column": 29,
                "line": 2,
              },
              "start": {
                "column": 3,
                "line": 2,
              },
            },
            "type": "string | undefined",
          },
        ],
        "type": "TextProps",
      }
    `)
  })

  test('complex library generic types', () => {
    const project = new Project({
      compilerOptions: { strictNullChecks: false },
      tsConfigFilePath: 'tsconfig.json',
    })
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import styled from 'styled-components'
      export const Text = styled.span<{ fontSize: number; fontWeight?: number }>({})
      `
    )
    const variableDeclaration = sourceFile.getVariableDeclarationOrThrow('Text')
    const processedType = processType(
      variableDeclaration.getType(),
      variableDeclaration,
      (symbolMetadata) => {
        if (symbolMetadata.name === 'theme') {
          return true
        }
        return !symbolMetadata.isInNodeModules
      }
    )

    expect(processedType).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Intersection",
        "name": undefined,
        "position": {
          "end": {
            "column": 79,
            "line": 2,
          },
          "start": {
            "column": 14,
            "line": 2,
          },
        },
        "properties": [
          {
            "filePath": "test.ts",
            "kind": "Component",
            "name": "Text",
            "position": {
              "end": {
                "column": 79,
                "line": 2,
              },
              "start": {
                "column": 14,
                "line": 2,
              },
            },
            "signatures": [
              {
                "kind": "ComponentSignature",
                "modifier": undefined,
                "properties": {
                  "defaultValue": undefined,
                  "description": undefined,
                  "filePath": "node_modules/styled-components/dist/types.d.ts",
                  "isOptional": false,
                  "kind": "Object",
                  "name": "props",
                  "position": {
                    "end": {
                      "column": 186,
                      "line": 133,
                    },
                    "start": {
                      "column": 111,
                      "line": 133,
                    },
                  },
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "filePath": "node_modules/styled-components/dist/types.d.ts",
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "Reference",
                      "name": "theme",
                      "position": {
                        "end": {
                          "column": 38,
                          "line": 71,
                        },
                        "start": {
                          "column": 5,
                          "line": 71,
                        },
                      },
                      "type": "DefaultTheme",
                    },
                  ],
                  "tags": undefined,
                  "type": "PolymorphicComponentProps<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, { fontSize: number; fontWeight?: number; }>, AsTarget, ForwardedAsTarget, AsTarget extends KnownTarget ? React.ComponentPropsWithRef<AsTarget> : {}, ForwardedAsTarget extends KnownTarget ? React.ComponentPropsWithRef<ForwardedAsTarget> : {}>",
                },
                "returnType": "Element",
                "type": "<AsTarget, ForwardedAsTarget>(props: PolymorphicComponentProps<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, { fontSize: number; fontWeight?: number; }>, AsTarget, ForwardedAsTarget, AsTarget extends KnownTarget ? React.ComponentPropsWithRef<AsTarget> : {}, ForwardedAsTarget extends KnownTarget ? React.ComponentPropsWithRef<ForwardedAsTarget> : {}>) => Element",
              },
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
                      "kind": "Number",
                      "name": "fontSize",
                      "position": {
                        "end": {
                          "column": 52,
                          "line": 2,
                        },
                        "start": {
                          "column": 35,
                          "line": 2,
                        },
                      },
                      "type": "number",
                    },
                    {
                      "defaultValue": undefined,
                      "filePath": "test.ts",
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "Number",
                      "name": "fontWeight",
                      "position": {
                        "end": {
                          "column": 72,
                          "line": 2,
                        },
                        "start": {
                          "column": 53,
                          "line": 2,
                        },
                      },
                      "type": "number",
                    },
                  ],
                  "type": "Substitute<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, { fontSize: number; fontWeight?: number; }>",
                },
                "returnType": "ReactNode",
                "type": "(props: Substitute<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, { fontSize: number; fontWeight?: number; }>) => ReactNode",
              },
            ],
            "type": "IStyledComponentBase<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, { fontSize: number; fontWeight?: number; }>>",
          },
          {
            "filePath": "test.ts",
            "kind": "String",
            "name": "Text",
            "position": {
              "end": {
                "column": 79,
                "line": 2,
              },
              "start": {
                "column": 14,
                "line": 2,
              },
            },
            "type": "string",
          },
        ],
        "type": "IStyledComponentBase<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, { fontSize: number; fontWeight?: number; }>> & string",
      }
    `)
  })

  test('enum', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      enum Color {
        Red = 'red',
        Blue = 'blue',
        Green = 'green',
      }
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getEnumOrThrow('Color')
    const processedProperties = processType(typeAlias.getType(), typeAlias)

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Enum",
        "members": {
          "Blue": "blue",
          "Green": "green",
          "Red": "red",
        },
        "name": "Color",
        "position": {
          "end": {
            "column": 2,
            "line": 5,
          },
          "start": {
            "column": 1,
            "line": 1,
          },
        },
        "type": "Color",
      }
    `)
  })

  test('enum property', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      enum Color {
        Red = 'red',
        Blue = 'blue',
        Green = 'green',
      }

      type TextProps = {
        color: Color;
      }
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('TextProps')
    const processedProperties = processType(typeAlias.getType(), typeAlias)

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "TextProps",
        "position": {
          "end": {
            "column": 2,
            "line": 9,
          },
          "start": {
            "column": 1,
            "line": 7,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Enum",
            "members": {
              "Blue": "blue",
              "Green": "green",
              "Red": "red",
            },
            "name": "color",
            "position": {
              "end": {
                "column": 16,
                "line": 8,
              },
              "start": {
                "column": 3,
                "line": 8,
              },
            },
            "type": "Color",
          },
        ],
        "type": "TextProps",
      }
    `)
  })

  test('class', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      class Text {
        color: string;

        setValue(value: string) {
          this.color = value;
        }
      }
      `,
      { overwrite: true }
    )
    const classDeclaration = sourceFile.getClassOrThrow('Text')
    const processedProperties = processType(
      classDeclaration.getType(),
      classDeclaration
    )

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Class",
        "methods": [
          {
            "kind": "ClassMethod",
            "name": "setValue",
            "scope": undefined,
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
                    "kind": "String",
                    "name": "value",
                    "position": {
                      "end": {
                        "column": 25,
                        "line": 4,
                      },
                      "start": {
                        "column": 12,
                        "line": 4,
                      },
                    },
                    "type": "string",
                  },
                ],
                "returnType": "void",
                "type": "(value: string) => void",
              },
            ],
            "type": "(value: string) => void",
            "visibility": undefined,
          },
        ],
        "name": "Text",
        "position": {
          "end": {
            "column": 2,
            "line": 7,
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
            "isReadonly": false,
            "kind": "String",
            "name": "color",
            "position": {
              "end": {
                "column": 17,
                "line": 2,
              },
              "start": {
                "column": 3,
                "line": 2,
              },
            },
            "scope": undefined,
            "type": "string",
            "visibility": undefined,
          },
        ],
        "type": "Text",
      }
    `)
  })

  test('class as property', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      class TextView {
        color: string = '#666'
      }

      type CardViewProps = {
        text: TextView;
      }
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('CardViewProps')
    const processedProperties = processType(typeAlias.getType(), typeAlias)

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "CardViewProps",
        "position": {
          "end": {
            "column": 2,
            "line": 7,
          },
          "start": {
            "column": 1,
            "line": 5,
          },
        },
        "properties": [
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Class",
            "name": "text",
            "position": {
              "end": {
                "column": 18,
                "line": 6,
              },
              "start": {
                "column": 3,
                "line": 6,
              },
            },
            "properties": [
              {
                "defaultValue": "#666",
                "filePath": "test.ts",
                "isReadonly": false,
                "kind": "String",
                "name": "color",
                "position": {
                  "end": {
                    "column": 25,
                    "line": 2,
                  },
                  "start": {
                    "column": 3,
                    "line": 2,
                  },
                },
                "scope": undefined,
                "type": "string",
                "visibility": undefined,
              },
            ],
            "type": "TextView",
          },
        ],
        "type": "CardViewProps",
      }
    `)
  })

  test('variable declaration', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      const color = 'blue'
      `,
      { overwrite: true }
    )
    const variableDeclaration =
      sourceFile.getVariableDeclarationOrThrow('color')
    const processedProperties = processType(
      variableDeclaration.getType(),
      variableDeclaration
    )

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "String",
        "name": "color",
        "position": {
          "end": {
            "column": 21,
            "line": 1,
          },
          "start": {
            "column": 7,
            "line": 1,
          },
        },
        "type": ""blue"",
      }
    `)
  })

  test('frozen objects marked as readonly', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      const color = Object.freeze({ red: 'red', blue: 'blue', green: 'green' })
      `,
      { overwrite: true }
    )
    const variableDeclaration =
      sourceFile.getVariableDeclarationOrThrow('color')
    const processedProperties = processType(
      variableDeclaration.getType(),
      variableDeclaration
    )

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "color",
        "position": {
          "end": {
            "column": 74,
            "line": 1,
          },
          "start": {
            "column": 7,
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
            "name": "red",
            "position": {
              "end": {
                "column": 41,
                "line": 1,
              },
              "start": {
                "column": 31,
                "line": 1,
              },
            },
            "type": ""red"",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "blue",
            "position": {
              "end": {
                "column": 55,
                "line": 1,
              },
              "start": {
                "column": 43,
                "line": 1,
              },
            },
            "type": ""blue"",
          },
          {
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "green",
            "position": {
              "end": {
                "column": 71,
                "line": 1,
              },
              "start": {
                "column": 57,
                "line": 1,
              },
            },
            "type": ""green"",
          },
        ],
        "type": "Readonly<{ red: "red"; blue: "blue"; green: "green"; }>",
      }
    `)
  })

  test('computes local generic arguments', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      const colors = { red: 'red', blue: 'blue', green: 'green' } as const;
      
      const getColor = (key: keyof typeof colors) => colors[key];

      export type TextProps = {
        color: ReturnType<typeof getColor>;
      }
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('TextProps')
    const processedProperties = processType(typeAlias.getType(), typeAlias)

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "TextProps",
        "position": {
          "end": {
            "column": 2,
            "line": 7,
          },
          "start": {
            "column": 1,
            "line": 5,
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
                    "column": 38,
                    "line": 6,
                  },
                  "start": {
                    "column": 3,
                    "line": 6,
                  },
                },
                "type": ""red"",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 38,
                    "line": 6,
                  },
                  "start": {
                    "column": 3,
                    "line": 6,
                  },
                },
                "type": ""blue"",
              },
              {
                "filePath": "test.ts",
                "kind": "String",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 38,
                    "line": 6,
                  },
                  "start": {
                    "column": 3,
                    "line": 6,
                  },
                },
                "type": ""green"",
              },
            ],
            "name": "color",
            "position": {
              "end": {
                "column": 38,
                "line": 6,
              },
              "start": {
                "column": 3,
                "line": 6,
              },
            },
            "type": ""red" | "blue" | "green"",
          },
        ],
        "type": "TextProps",
      }
    `)
  })

  test('references locally exported generic arguments', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      const colors = { red: 'red', blue: 'blue', green: 'green' } as const;
      
      export const getColor = (key: keyof typeof colors) => colors[key];

      export type TextProps = {
        color: ReturnType<typeof getColor>;
      }
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('TextProps')
    const processedProperties = processType(typeAlias.getType(), typeAlias)

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "TextProps",
        "position": {
          "end": {
            "column": 2,
            "line": 7,
          },
          "start": {
            "column": 1,
            "line": 5,
          },
        },
        "properties": [
          {
            "arguments": [
              {
                "filePath": "test.ts",
                "kind": "Reference",
                "position": {
                  "end": {
                    "column": 66,
                    "line": 3,
                  },
                  "start": {
                    "column": 25,
                    "line": 3,
                  },
                },
                "type": "typeof getColor",
              },
            ],
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "color",
            "position": {
              "end": {
                "column": 38,
                "line": 6,
              },
              "start": {
                "column": 3,
                "line": 6,
              },
            },
            "type": "ReturnType<typeof getColor>",
            "typeName": "ReturnType",
          },
        ],
        "type": "TextProps",
      }
    `)
  })

  test('references external generic arguments', () => {
    project.createSourceFile(
      'node_modules/@types/colors/index.d.ts',
      dedent`
      const colors = { red: 'red', blue: 'blue', green: 'green' } as const;
      export const getColor = (key: keyof typeof colors) => colors[key];
      `
    )

    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import type { getColor } from 'colors';

      export type TextProps = {
        color: ReturnType<typeof getColor>;
      }
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('TextProps')
    const processedProperties = processType(typeAlias.getType(), typeAlias)

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "TextProps",
        "position": {
          "end": {
            "column": 2,
            "line": 5,
          },
          "start": {
            "column": 1,
            "line": 3,
          },
        },
        "properties": [
          {
            "arguments": [
              {
                "filePath": "node_modules/@types/colors/index.d.ts",
                "kind": "Reference",
                "position": {
                  "end": {
                    "column": 66,
                    "line": 2,
                  },
                  "start": {
                    "column": 25,
                    "line": 2,
                  },
                },
                "type": "typeof getColor",
              },
            ],
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "color",
            "position": {
              "end": {
                "column": 38,
                "line": 4,
              },
              "start": {
                "column": 3,
                "line": 4,
              },
            },
            "type": "ReturnType<typeof getColor>",
            "typeName": "ReturnType",
          },
        ],
        "type": "TextProps",
      }
    `)
  })

  test('uses immediate generic for type and type name', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      const foo = async () => {
        return {
          slug: 'foo',
          filePath: 'bar',
        }
      }

      export type ComplexType = {
        functionReturn: ReturnType<typeof foo>;
      };
      `,
      { overwrite: true }
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('ComplexType')
    const processedProperties = processType(typeAlias.getType(), typeAlias)

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "filePath": "test.ts",
        "kind": "Object",
        "name": "ComplexType",
        "position": {
          "end": {
            "column": 3,
            "line": 10,
          },
          "start": {
            "column": 1,
            "line": 8,
          },
        },
        "properties": [
          {
            "arguments": [
              {
                "filePath": "test.ts",
                "kind": "Object",
                "name": undefined,
                "position": {
                  "end": {
                    "column": 4,
                    "line": 5,
                  },
                  "start": {
                    "column": 10,
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
                    "name": "slug",
                    "position": {
                      "end": {
                        "column": 16,
                        "line": 3,
                      },
                      "start": {
                        "column": 5,
                        "line": 3,
                      },
                    },
                    "type": "string",
                  },
                  {
                    "defaultValue": undefined,
                    "filePath": "test.ts",
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "filePath",
                    "position": {
                      "end": {
                        "column": 20,
                        "line": 4,
                      },
                      "start": {
                        "column": 5,
                        "line": 4,
                      },
                    },
                    "type": "string",
                  },
                ],
                "type": "{ slug: string; filePath: string; }",
              },
            ],
            "defaultValue": undefined,
            "filePath": "test.ts",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "functionReturn",
            "position": {
              "end": {
                "column": 42,
                "line": 9,
              },
              "start": {
                "column": 3,
                "line": 9,
              },
            },
            "type": "Promise<{ slug: string; filePath: string; }>",
            "typeName": "Promise",
          },
        ],
        "type": "ComplexType",
      }
    `)
  })
})
