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
        "kind": "Object",
        "name": "ModuleData",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Function",
            "name": "method",
            "signatures": [
              {
                "kind": "FunctionSignature",
                "modifier": undefined,
                "parameters": [
                  {
                    "defaultValue": undefined,
                    "description": undefined,
                    "isOptional": false,
                    "kind": "Object",
                    "name": "parameterValue",
                    "properties": [
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "Number",
                        "name": "objectValue",
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
              "kind": "Reference",
              "path": "test.ts:2:3",
              "type": "ExportedType",
            },
            "isOptional": false,
            "isReadonly": false,
            "kind": "Array",
            "name": "exportedTypes",
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
              "kind": "Reference",
              "path": "test.ts:2:3",
              "type": "ExportedType",
            },
          ],
          "defaultValue": undefined,
          "isOptional": true,
          "isReadonly": false,
          "kind": "Generic",
          "name": "promiseObject",
          "type": "Promise<ExportedType>",
          "typeName": "Promise",
        },
        {
          "arguments": [
            {
              "kind": "Function",
              "name": undefined,
              "signatures": [
                {
                  "kind": "FunctionSignature",
                  "modifier": undefined,
                  "parameters": [
                    {
                      "defaultValue": undefined,
                      "description": undefined,
                      "isOptional": false,
                      "kind": "Number",
                      "name": "a",
                      "type": "number",
                    },
                    {
                      "defaultValue": undefined,
                      "description": undefined,
                      "isOptional": false,
                      "kind": "String",
                      "name": "b",
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
          "isOptional": false,
          "isReadonly": false,
          "kind": "Generic",
          "name": "promiseFunction",
          "type": "Promise<(a: number, b: string) => void>",
          "typeName": "Promise",
        },
        {
          "arguments": [
            {
              "kind": "Object",
              "name": undefined,
              "properties": [
                {
                  "defaultValue": undefined,
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "String",
                  "name": "slug",
                  "type": "string",
                },
                {
                  "defaultValue": undefined,
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "String",
                  "name": "filePath",
                  "type": "string",
                },
              ],
              "type": "{ slug: string; filePath: string; }",
            },
          ],
          "defaultValue": undefined,
          "isOptional": false,
          "isReadonly": false,
          "kind": "Generic",
          "name": "promiseVariable",
          "type": "Promise<{ slug: string; filePath: string; }>",
          "typeName": "Promise",
        },
        {
          "defaultValue": undefined,
          "isOptional": false,
          "isReadonly": false,
          "kind": "Union",
          "members": [
            {
              "kind": "String",
              "name": undefined,
              "type": "string",
            },
            {
              "kind": "Number",
              "name": undefined,
              "type": "number",
            },
          ],
          "name": "union",
          "type": "string | number",
        },
        {
          "defaultValue": undefined,
          "isOptional": false,
          "isReadonly": false,
          "kind": "Union",
          "members": [
            {
              "kind": "String",
              "name": undefined,
              "type": "string",
            },
            {
              "kind": "Function",
              "name": undefined,
              "signatures": [
                {
                  "kind": "FunctionSignature",
                  "modifier": undefined,
                  "parameters": [
                    {
                      "defaultValue": undefined,
                      "description": undefined,
                      "isOptional": false,
                      "kind": "String",
                      "name": "a",
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
              "kind": "Object",
              "name": undefined,
              "properties": [
                {
                  "defaultValue": undefined,
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "String",
                  "name": "a",
                  "type": "string",
                },
              ],
              "type": "{ a: string; }",
            },
            {
              "kind": "Object",
              "name": undefined,
              "properties": [
                {
                  "defaultValue": undefined,
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "Number",
                  "name": "b",
                  "type": "number",
                },
                {
                  "defaultValue": undefined,
                  "element": {
                    "kind": "Union",
                    "members": [
                      {
                        "kind": "String",
                        "name": undefined,
                        "type": "string",
                      },
                      {
                        "kind": "Number",
                        "name": undefined,
                        "type": "number",
                      },
                    ],
                    "name": undefined,
                    "type": "string | number",
                  },
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "Array",
                  "name": "c",
                  "type": "Array<string | number>",
                },
              ],
              "type": "{ b: number; c: (string | number)[]; }",
            },
          ],
          "name": "complexUnion",
          "type": "string | ((a: string) => string | number) | { a: string; } | { b: number; c: (string | number)[]; }",
        },
        {
          "defaultValue": undefined,
          "isOptional": false,
          "isReadonly": false,
          "kind": "Object",
          "name": "intersection",
          "properties": [
            {
              "defaultValue": undefined,
              "isOptional": false,
              "isReadonly": false,
              "kind": "String",
              "name": "a",
              "type": "string",
            },
            {
              "defaultValue": undefined,
              "isOptional": false,
              "isReadonly": false,
              "kind": "Number",
              "name": "b",
              "type": "number",
            },
          ],
          "type": "{ a: string; } & { b: number; }",
        },
        {
          "defaultValue": undefined,
          "isOptional": false,
          "isReadonly": false,
          "kind": "Intersection",
          "name": "complexIntersection",
          "properties": [
            {
              "arguments": [
                {
                  "kind": "Reference",
                  "path": "test.ts:2:3",
                  "type": "ExportedType",
                },
              ],
              "kind": "Generic",
              "name": undefined,
              "type": "Promise<ExportedType>",
              "typeName": "Promise",
            },
            {
              "defaultValue": undefined,
              "isOptional": false,
              "isReadonly": false,
              "kind": "String",
              "name": "a",
              "type": "string",
            },
            {
              "defaultValue": undefined,
              "isOptional": false,
              "isReadonly": false,
              "kind": "Function",
              "name": "b",
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
              "kind": "String",
              "name": "a",
              "type": "string",
            },
            {
              "kind": "Number",
              "name": "b",
              "type": "number",
            },
            {
              "kind": "String",
              "name": "string",
              "type": "string",
            },
          ],
          "isOptional": false,
          "isReadonly": false,
          "kind": "Tuple",
          "name": "tuple",
          "type": "[a: string, b: number, string]",
        },
        {
          "defaultValue": undefined,
          "isOptional": false,
          "isReadonly": false,
          "kind": "Function",
          "name": "function",
          "signatures": [
            {
              "kind": "FunctionSignature",
              "modifier": undefined,
              "parameters": [
                {
                  "defaultValue": undefined,
                  "description": undefined,
                  "isOptional": false,
                  "kind": "String",
                  "name": "param1",
                  "type": "string",
                },
                {
                  "defaultValue": undefined,
                  "description": undefined,
                  "isOptional": true,
                  "kind": "Number",
                  "name": "param2",
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
        "kind": "Union",
        "members": [
          {
            "kind": "String",
            "name": undefined,
            "type": "string",
          },
          {
            "kind": "Intersection",
            "name": "FillVariant",
            "properties": [
              {
                "defaultValue": undefined,
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "backgroundColor",
                "type": "string",
              },
              {
                "kind": "Reference",
                "path": "test.ts:2:7",
                "type": "BaseVariant",
              },
            ],
            "type": "FillVariant",
          },
          {
            "kind": "Intersection",
            "name": "OutlineVariant",
            "properties": [
              {
                "defaultValue": undefined,
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "borderColor",
                "type": "string",
              },
              {
                "kind": "Reference",
                "path": "test.ts:2:7",
                "type": "BaseVariant",
              },
            ],
            "type": "OutlineVariant",
          },
        ],
        "name": "Variant",
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
        "kind": "Object",
        "name": "Primitives",
        "properties": [
          {
            "defaultValue": undefined,
            "description": "a string",
            "isOptional": false,
            "isReadonly": false,
            "kind": "String",
            "name": "str",
            "tags": undefined,
            "type": "string",
          },
          {
            "defaultValue": undefined,
            "description": "
      a number",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Number",
            "name": "num",
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
            "isOptional": false,
            "isReadonly": false,
            "kind": "Boolean",
            "name": "bool",
            "type": "boolean",
          },
          {
            "defaultValue": undefined,
            "element": {
              "kind": "String",
              "name": undefined,
              "type": "string",
            },
            "isOptional": false,
            "isReadonly": false,
            "kind": "Array",
            "name": "arr",
            "type": "Array<string>",
          },
          {
            "arguments": [
              {
                "kind": "String",
                "name": undefined,
                "type": "string",
              },
              {
                "kind": "Object",
                "name": undefined,
                "properties": [
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "value",
                    "type": "number",
                  },
                ],
                "type": "{ value: number; }",
              },
            ],
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "obj",
            "type": "Record<string, { value: number }>",
            "typeName": "Record",
          },
          {
            "defaultValue": undefined,
            "description": "Accepts a string",
            "isOptional": false,
            "isReadonly": false,
            "kind": "Function",
            "name": "func",
            "signatures": [
              {
                "kind": "FunctionSignature",
                "modifier": undefined,
                "parameters": [
                  {
                    "defaultValue": undefined,
                    "description": "a string parameter",
                    "isOptional": false,
                    "kind": "String",
                    "name": "a",
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
            "isOptional": false,
            "isReadonly": false,
            "kind": "Function",
            "name": "asyncFunc",
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
        "kind": "Object",
        "name": "a",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": true,
            "kind": "Object",
            "name": "e",
            "properties": [
              {
                "defaultValue": undefined,
                "isOptional": false,
                "isReadonly": false,
                "kind": "Number",
                "name": "f",
                "type": "number",
              },
            ],
            "type": "{ f: number; }",
          },
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "g",
            "type": "string",
          },
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": true,
            "kind": "Number",
            "name": "b",
            "type": "1",
          },
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "c",
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
        "kind": "Object",
        "name": "SelfReferencedType",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "String",
            "name": "id",
            "type": "string",
          },
          {
            "defaultValue": undefined,
            "element": {
              "kind": "Reference",
              "path": "test.ts:2:7",
              "type": "SelfReferencedType",
            },
            "isOptional": false,
            "isReadonly": false,
            "kind": "Array",
            "name": "children",
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
        "kind": "Object",
        "name": "FileSystem",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Reference",
            "name": "readFile",
            "path": "node_modules/@types/library/index.d.ts:1:1",
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
        "kind": "Object",
        "name": "AsyncString",
        "properties": [
          {
            "arguments": [
              {
                "kind": "Object",
                "name": "Foo",
                "properties": [
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "bar",
                    "type": ""baz"",
                  },
                ],
                "type": "Foo",
              },
            ],
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "value",
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

    // TODO: in this case the promise should be unwrapped instead of marked as a Generic

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "kind": "Union",
        "members": [
          {
            "arguments": [
              {
                "kind": "Union",
                "members": [
                  {
                    "kind": "Object",
                    "name": "Omit",
                    "properties": [
                      {
                        "arguments": [
                          {
                            "kind": "Number",
                            "name": undefined,
                            "type": "number",
                          },
                        ],
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "Generic",
                        "name": "a",
                        "type": "Promise<number>",
                        "typeName": "Promise",
                      },
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "url",
                        "type": "string",
                      },
                    ],
                    "type": "Omit<A, "title">",
                  },
                  {
                    "kind": "Object",
                    "name": "Omit",
                    "properties": [
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "url",
                        "type": "string",
                      },
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "Number",
                        "name": "b",
                        "type": "number",
                      },
                    ],
                    "type": "Omit<B, "title">",
                  },
                ],
                "name": undefined,
                "type": "DistributiveOmit<UnionType, 'title'>",
              },
            ],
            "kind": "Generic",
            "type": "UnwrapPromisesInMap<DistributiveOmit<UnionType, 'title'>>",
            "typeName": "UnwrapPromisesInMap",
          },
          {
            "arguments": [
              {
                "kind": "Union",
                "members": [
                  {
                    "kind": "Object",
                    "name": "Omit",
                    "properties": [
                      {
                        "arguments": [
                          {
                            "kind": "Number",
                            "name": undefined,
                            "type": "number",
                          },
                        ],
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "Generic",
                        "name": "a",
                        "type": "Promise<number>",
                        "typeName": "Promise",
                      },
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "url",
                        "type": "string",
                      },
                    ],
                    "type": "Omit<A, "title">",
                  },
                  {
                    "kind": "Object",
                    "name": "Omit",
                    "properties": [
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "url",
                        "type": "string",
                      },
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "Number",
                        "name": "b",
                        "type": "number",
                      },
                    ],
                    "type": "Omit<B, "title">",
                  },
                ],
                "name": undefined,
                "type": "DistributiveOmit<UnionType, 'title'>",
              },
            ],
            "kind": "Generic",
            "type": "UnwrapPromisesInMap<DistributiveOmit<UnionType, 'title'>>",
            "typeName": "UnwrapPromisesInMap",
          },
        ],
        "name": "ExportedType",
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
        "kind": "Object",
        "name": "TextProps",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Reference",
            "name": "color",
            "path": "library/index.d.ts:1:1",
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
        "kind": "Object",
        "name": "TextProps",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": true,
            "isReadonly": false,
            "kind": "Union",
            "members": [
              {
                "kind": "String",
                "name": undefined,
                "type": "string",
              },
              {
                "kind": "Number",
                "name": undefined,
                "type": "number",
              },
            ],
            "name": "fontWeight",
            "type": "string | number",
          },
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Reference",
            "name": "color",
            "path": "node_modules/@types/library/index.d.ts:1:1",
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
        "kind": "Object",
        "name": "ModuleData",
        "properties": [
          {
            "defaultValue": undefined,
            "element": {
              "kind": "Union",
              "members": [
                {
                  "kind": "Intersection",
                  "name": undefined,
                  "properties": [
                    {
                      "kind": "Reference",
                      "path": "node_modules/@types/library/index.d.ts:1:1",
                      "type": "FunctionMetadata",
                    },
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "slug",
                      "type": "string",
                    },
                  ],
                  "type": "FunctionMetadata & { slug: string; }",
                },
                {
                  "kind": "Intersection",
                  "name": undefined,
                  "properties": [
                    {
                      "kind": "Reference",
                      "path": "node_modules/@types/library/index.d.ts:1:1",
                      "type": "TypeMetadata",
                    },
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "slug",
                      "type": "string",
                    },
                  ],
                  "type": "TypeMetadata & { slug: string; }",
                },
              ],
              "name": "ExportedType",
              "type": "ExportedType",
            },
            "isOptional": false,
            "isReadonly": false,
            "kind": "Array",
            "name": "exportedTypes",
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
        "kind": "Function",
        "name": "Text",
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "isOptional": false,
                "kind": "Reference",
                "name": "color",
                "path": "node_modules/@types/library/index.d.ts:1:1",
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
        "kind": "Component",
        "name": "Text",
        "signatures": [
          {
            "kind": "ComponentSignature",
            "modifier": undefined,
            "properties": {
              "defaultValue": undefined,
              "description": undefined,
              "isOptional": true,
              "kind": "Object",
              "name": "props",
              "properties": [
                {
                  "defaultValue": undefined,
                  "isOptional": false,
                  "isReadonly": false,
                  "kind": "Reference",
                  "name": "color",
                  "path": "node_modules/@types/library/index.d.ts:1:1",
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
        "kind": "Function",
        "name": "Text",
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "isOptional": false,
                "kind": "Reference",
                "name": "props",
                "path": "test.ts:1:1",
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
        "kind": "Function",
        "name": "Text",
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
                "isOptional": false,
                "kind": "Reference",
                "name": "props",
                "path": "test.ts:1:1",
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
        "kind": "Component",
        "name": "Text",
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
              "isOptional": false,
              "kind": "Object",
              "name": undefined,
              "properties": [
                {
                  "defaultValue": {
                    "color": "blue",
                    "fontWeight": 400,
                  },
                  "isOptional": true,
                  "isReadonly": false,
                  "kind": "Object",
                  "name": "style",
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "Number",
                      "name": "fontSize",
                      "type": "number",
                    },
                    {
                      "defaultValue": 400,
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "Number",
                      "name": "fontWeight",
                      "type": "number",
                    },
                    {
                      "defaultValue": "blue",
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "color",
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
        "kind": "Union",
        "members": [
          {
            "kind": "Object",
            "name": undefined,
            "properties": [
              {
                "arguments": [
                  {
                    "kind": "String",
                    "name": undefined,
                    "type": "string",
                  },
                  {
                    "kind": "Primitive",
                    "type": "any",
                  },
                ],
                "defaultValue": undefined,
                "isOptional": false,
                "isReadonly": false,
                "kind": "Generic",
                "name": "frontMatter",
                "type": "Record<string, any>",
                "typeName": "Record",
              },
            ],
            "type": "{ frontMatter: Record<string, any>; }",
          },
          {
            "kind": "Object",
            "name": undefined,
            "properties": [
              {
                "arguments": [
                  {
                    "kind": "String",
                    "name": undefined,
                    "type": "string",
                  },
                  {
                    "kind": "Primitive",
                    "type": "any",
                  },
                ],
                "defaultValue": undefined,
                "isOptional": false,
                "isReadonly": false,
                "kind": "Generic",
                "name": "frontMatter",
                "type": "Record<string, any>",
                "typeName": "Record",
              },
            ],
            "type": "{ frontMatter: Record<string, any>; }",
          },
        ],
        "name": undefined,
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
        "kind": "Function",
        "name": undefined,
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "isOptional": false,
                "kind": "Object",
                "name": "props",
                "properties": [
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "columns",
                    "type": "number",
                  },
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "rows",
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
        "kind": "Object",
        "name": "TextProps",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Union",
            "members": [
              {
                "kind": "Primitive",
                "type": "undefined",
              },
              {
                "kind": "String",
                "name": undefined,
                "type": "string",
              },
            ],
            "name": "color",
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
        "kind": "Intersection",
        "name": undefined,
        "properties": [
          {
            "kind": "Component",
            "name": "Text",
            "signatures": [
              {
                "kind": "ComponentSignature",
                "modifier": undefined,
                "properties": {
                  "defaultValue": undefined,
                  "description": undefined,
                  "isOptional": false,
                  "kind": "Object",
                  "name": "props",
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "Reference",
                      "name": "theme",
                      "path": "node_modules/styled-components/dist/models/ThemeProvider.d.ts:1:1",
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
                  "isOptional": false,
                  "kind": "Object",
                  "name": "props",
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "Number",
                      "name": "fontSize",
                      "type": "number",
                    },
                    {
                      "defaultValue": undefined,
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "Number",
                      "name": "fontWeight",
                      "type": "number",
                    },
                  ],
                  "type": "Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, { fontSize: number; fontWeight?: number; }>",
                },
                "returnType": "ReactNode",
                "type": "(props: Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, { fontSize: number; fontWeight?: number; }>) => ReactNode",
              },
            ],
            "type": "IStyledComponentBase<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, { fontSize: number; fontWeight?: number; }>>",
          },
          {
            "kind": "String",
            "name": "Text",
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
        "kind": "Enum",
        "members": {
          "Blue": "blue",
          "Green": "green",
          "Red": "red",
        },
        "name": "Color",
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
        "kind": "Object",
        "name": "TextProps",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Enum",
            "members": {
              "Blue": "blue",
              "Green": "green",
              "Red": "red",
            },
            "name": "color",
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
                    "isOptional": false,
                    "kind": "String",
                    "name": "value",
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
        "properties": [
          {
            "defaultValue": undefined,
            "isReadonly": false,
            "kind": "String",
            "name": "color",
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
        "kind": "Object",
        "name": "CardViewProps",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Class",
            "name": "text",
            "properties": [
              {
                "defaultValue": "#666",
                "isReadonly": false,
                "kind": "String",
                "name": "color",
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
        "kind": "String",
        "name": "color",
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
        "kind": "Object",
        "name": "color",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "red",
            "type": ""red"",
          },
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "blue",
            "type": ""blue"",
          },
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": true,
            "kind": "String",
            "name": "green",
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

    // TODO: if all generic arguments are not references it should use the computed return type

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "kind": "Object",
        "name": "TextProps",
        "properties": [
          {
            "arguments": [
              {
                "kind": "Function",
                "name": undefined,
                "signatures": [
                  {
                    "kind": "FunctionSignature",
                    "modifier": undefined,
                    "parameters": [
                      {
                        "defaultValue": undefined,
                        "description": undefined,
                        "isOptional": false,
                        "kind": "Union",
                        "members": [
                          {
                            "kind": "String",
                            "name": undefined,
                            "type": ""red"",
                          },
                          {
                            "kind": "String",
                            "name": undefined,
                            "type": ""blue"",
                          },
                          {
                            "kind": "String",
                            "name": undefined,
                            "type": ""green"",
                          },
                        ],
                        "name": "key",
                        "type": ""red" | "blue" | "green"",
                      },
                    ],
                    "returnType": ""red" | "blue" | "green"",
                    "type": "(key: "red" | "blue" | "green") => "red" | "blue" | "green"",
                  },
                ],
                "type": "typeof getColor",
              },
            ],
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "color",
            "type": "ReturnType<typeof getColor>",
            "typeName": "ReturnType",
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
        "kind": "Object",
        "name": "TextProps",
        "properties": [
          {
            "arguments": [
              {
                "kind": "Reference",
                "path": "test.ts:1:1",
                "type": "typeof getColor",
              },
            ],
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "color",
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
        "kind": "Object",
        "name": "TextProps",
        "properties": [
          {
            "arguments": [
              {
                "kind": "Reference",
                "path": "node_modules/@types/colors/index.d.ts:1:1",
                "type": "typeof getColor",
              },
            ],
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "color",
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
        "kind": "Object",
        "name": "ComplexType",
        "properties": [
          {
            "arguments": [
              {
                "kind": "Object",
                "name": undefined,
                "properties": [
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "slug",
                    "type": "string",
                  },
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "filePath",
                    "type": "string",
                  },
                ],
                "type": "{ slug: string; filePath: string; }",
              },
            ],
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Generic",
            "name": "functionReturn",
            "type": "Promise<{ slug: string; filePath: string; }>",
            "typeName": "Promise",
          },
        ],
        "type": "ComplexType",
      }
    `)
  })
})
