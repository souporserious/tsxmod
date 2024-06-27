import { Project } from 'ts-morph'
import { processTypeProperties, processType } from './processType'
import dedent from 'dedent'

describe('processProperties', () => {
  const project = new Project()

  const sourceFile = project.createSourceFile(
    'sample.ts',
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
            "isOptional": false,
            "kind": "Function",
            "name": "method",
            "signatures": [
              {
                "parameters": [
                  {
                    "description": undefined,
                    "isOptional": false,
                    "kind": "Object",
                    "name": "parameterValue",
                    "properties": [
                      {
                        "isOptional": false,
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
            "isOptional": false,
            "kind": "Array",
            "name": "exportedTypes",
            "type": {
              "kind": "Reference",
              "type": "ExportedType",
            },
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
              "type": "ExportedType",
            },
          ],
          "isOptional": true,
          "kind": "Generic",
          "name": "promiseObject",
          "type": "Promise<ExportedType>",
        },
        {
          "arguments": [
            {
              "kind": "Function",
              "name": undefined,
              "signatures": [
                {
                  "parameters": [
                    {
                      "description": undefined,
                      "isOptional": false,
                      "kind": "Number",
                      "name": "a",
                      "type": "number",
                    },
                    {
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
          "isOptional": false,
          "kind": "Generic",
          "name": "promiseFunction",
          "type": "Promise<(a: number, b: string) => void>",
        },
        {
          "arguments": [
            {
              "kind": "Object",
              "name": undefined,
              "properties": [
                {
                  "isOptional": false,
                  "kind": "String",
                  "name": "slug",
                  "type": "string",
                },
                {
                  "isOptional": false,
                  "kind": "String",
                  "name": "filePath",
                  "type": "string",
                },
              ],
              "type": "{ slug: string; filePath: string; }",
            },
          ],
          "isOptional": false,
          "kind": "Generic",
          "name": "promiseVariable",
          "type": "Promise<{ slug: string; filePath: string; }>",
        },
        {
          "isOptional": false,
          "kind": "Union",
          "name": "union",
          "properties": [
            {
              "kind": "String",
              "type": "string",
            },
            {
              "kind": "Number",
              "type": "number",
            },
          ],
          "type": "string | number",
        },
        {
          "isOptional": false,
          "kind": "Union",
          "name": "complexUnion",
          "properties": [
            {
              "kind": "String",
              "type": "string",
            },
            {
              "kind": "Function",
              "name": undefined,
              "signatures": [
                {
                  "parameters": [
                    {
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
                  "isOptional": false,
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
                  "isOptional": false,
                  "kind": "Number",
                  "name": "b",
                  "type": "number",
                },
                {
                  "isOptional": false,
                  "kind": "Array",
                  "name": "c",
                  "type": {
                    "kind": "Union",
                    "name": undefined,
                    "properties": [
                      {
                        "kind": "String",
                        "type": "string",
                      },
                      {
                        "kind": "Number",
                        "type": "number",
                      },
                    ],
                    "type": "string | number",
                  },
                },
              ],
              "type": "{ b: number; c: (string | number)[]; }",
            },
          ],
          "type": "string | ((a: string) => string | number) | { a: string; } | { b: number; c: (string | number)[]; }",
        },
        {
          "isOptional": false,
          "kind": "Intersection",
          "name": "intersection",
          "properties": [
            {
              "kind": "Object",
              "name": undefined,
              "properties": [
                {
                  "isOptional": false,
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
                  "isOptional": false,
                  "kind": "Number",
                  "name": "b",
                  "type": "number",
                },
              ],
              "type": "{ b: number; }",
            },
          ],
          "type": "{ a: string; } & { b: number; }",
        },
        {
          "isOptional": false,
          "kind": "Intersection",
          "name": "complexIntersection",
          "properties": [
            {
              "arguments": [
                {
                  "kind": "Reference",
                  "type": "ExportedType",
                },
              ],
              "kind": "Generic",
              "name": "Promise",
              "type": "Promise<ExportedType>",
            },
            {
              "kind": "Object",
              "name": undefined,
              "properties": [
                {
                  "isOptional": false,
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
                  "isOptional": false,
                  "kind": "Function",
                  "name": "b",
                  "signatures": [
                    {
                      "parameters": [],
                      "returnType": "void",
                      "type": "() => void",
                    },
                  ],
                  "type": "() => void",
                },
              ],
              "type": "{ b(): void; }",
            },
          ],
          "type": "Promise<ExportedType> & { a: string; } & { b(): void; }",
        },
        {
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
          "kind": "Tuple",
          "name": "tuple",
          "type": "[a: string, b: number, string]",
        },
        {
          "isOptional": false,
          "kind": "Function",
          "name": "function",
          "signatures": [
            {
              "parameters": [
                {
                  "description": undefined,
                  "isOptional": false,
                  "kind": "String",
                  "name": "param1",
                  "type": "string",
                },
                {
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
    const project = new Project()
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
    `
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('Variant')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "kind": "Union",
        "name": "Variant",
        "properties": [
          {
            "kind": "String",
            "type": "string",
          },
          {
            "kind": "Intersection",
            "name": "FillVariant",
            "properties": [
              {
                "kind": "Object",
                "name": undefined,
                "properties": [
                  {
                    "isOptional": false,
                    "kind": "String",
                    "name": "backgroundColor",
                    "type": "string",
                  },
                ],
                "type": "{ backgroundColor: string; }",
              },
              {
                "kind": "Reference",
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
                "kind": "Object",
                "name": undefined,
                "properties": [
                  {
                    "isOptional": false,
                    "kind": "String",
                    "name": "borderColor",
                    "type": "string",
                  },
                ],
                "type": "{ borderColor: string; }",
              },
              {
                "kind": "Reference",
                "type": "BaseVariant",
              },
            ],
            "type": "OutlineVariant",
          },
        ],
        "type": "Variant<T>",
      }
    `)
  })

  test('primitives', () => {
    const project = new Project()
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
      }
    `
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('Primitives')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "kind": "Object",
        "name": "Primitives",
        "properties": [
          {
            "description": "a string",
            "isOptional": false,
            "kind": "String",
            "name": "str",
            "tags": undefined,
            "type": "string",
          },
          {
            "description": "
      a number",
            "isOptional": false,
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
            "isOptional": false,
            "kind": "Boolean",
            "name": "bool",
            "type": "boolean",
          },
          {
            "isOptional": false,
            "kind": "Array",
            "name": "arr",
            "type": {
              "kind": "String",
              "type": "string",
            },
          },
          {
            "arguments": [
              {
                "kind": "String",
                "type": "string",
              },
              {
                "kind": "Object",
                "name": undefined,
                "properties": [
                  {
                    "isOptional": false,
                    "kind": "Number",
                    "name": "value",
                    "type": "number",
                  },
                ],
                "type": "{ value: number; }",
              },
            ],
            "isOptional": false,
            "kind": "Utility",
            "name": "obj",
            "type": "Record<string, { value: number; }>",
          },
          {
            "description": "Accepts a string",
            "isOptional": false,
            "kind": "Function",
            "name": "func",
            "signatures": [
              {
                "parameters": [
                  {
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
        ],
        "type": "Primitives",
      }
    `)
  })

  test('variable declarations', () => {
    const project = new Project()
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
    `
    )
    const variableDeclaration = sourceFile.getVariableDeclarationOrThrow('a')
    const processedProperties = processType(variableDeclaration.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "kind": "Object",
        "name": undefined,
        "properties": [
          {
            "isOptional": false,
            "kind": "Object",
            "name": "e",
            "properties": [
              {
                "isOptional": false,
                "kind": "Number",
                "name": "f",
                "type": "number",
              },
            ],
            "type": "{ f: number; }",
          },
          {
            "isOptional": false,
            "kind": "String",
            "name": "g",
            "type": "string",
          },
          {
            "isOptional": false,
            "kind": "Number",
            "name": "b",
            "type": "1",
          },
          {
            "isOptional": false,
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
    const project = new Project()
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      type SelfReferencedType = {
        id: string;
        children: SelfReferencedType[];
      }
    `
    )
    const typeAlias = sourceFile.getTypeAliasOrThrow('SelfReferencedType')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "kind": "Object",
        "name": "SelfReferencedType",
        "properties": [
          {
            "isOptional": false,
            "kind": "String",
            "name": "id",
            "type": "string",
          },
          {
            "isOptional": false,
            "kind": "Array",
            "name": "children",
            "type": {
              "kind": "Reference",
              "type": "SelfReferencedType",
            },
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
            "isOptional": false,
            "kind": "Reference",
            "name": "readFile",
            "type": "(path: string, callback: (err: Error, data: Buffer) => void) => void",
          },
        ],
        "type": "FileSystem",
      }
    `)
  })

  test('avoids analyzing prototype properties and methods', () => {
    const project = new Project()

    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      type Foo = {
        bar: 'baz'
      }
      
      type AsyncString = {
        value: Promise<Foo>
      }
      `
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
                    "isOptional": false,
                    "kind": "String",
                    "name": "bar",
                    "type": ""baz"",
                  },
                ],
                "type": "Foo",
              },
            ],
            "isOptional": false,
            "kind": "Generic",
            "name": "value",
            "type": "Promise<Foo>",
          },
        ],
        "type": "AsyncString",
      }
    `)
  })

  test('unwraps generic types', () => {
    const project = new Project()

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
      `
    )

    const typeAlias = sourceFile.getTypeAliasOrThrow('ExportedType')
    const processedProperties = processType(typeAlias.getType())

    expect(processedProperties).toMatchInlineSnapshot(`
      {
        "kind": "Union",
        "name": "ExportedType",
        "properties": [
          {
            "kind": "Object",
            "name": "UnwrapPromisesInMap",
            "properties": [
              {
                "isOptional": false,
                "kind": "Number",
                "name": "a",
                "type": "number",
              },
              {
                "isOptional": false,
                "kind": "String",
                "name": "url",
                "type": "string",
              },
            ],
            "type": "UnwrapPromisesInMap<Omit<A, "title">>",
          },
          {
            "kind": "Object",
            "name": "UnwrapPromisesInMap",
            "properties": [
              {
                "isOptional": false,
                "kind": "String",
                "name": "url",
                "type": "string",
              },
              {
                "isOptional": false,
                "kind": "Number",
                "name": "b",
                "type": "number",
              },
            ],
            "type": "UnwrapPromisesInMap<Omit<B, "title">>",
          },
        ],
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
            "isOptional": false,
            "kind": "Reference",
            "name": "color",
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
        "kind": "Intersection",
        "name": "TextProps",
        "properties": [
          {
            "kind": "Object",
            "name": undefined,
            "properties": [
              {
                "isOptional": true,
                "kind": "Union",
                "name": "fontWeight",
                "properties": [
                  {
                    "kind": "String",
                    "type": "string",
                  },
                  {
                    "kind": "Number",
                    "type": "number",
                  },
                ],
                "type": "string | number",
              },
            ],
            "type": "{ fontWeight?: string | number; }",
          },
          {
            "kind": "Object",
            "name": "DropDollarPrefix",
            "properties": [
              {
                "isOptional": false,
                "kind": "Reference",
                "name": "color",
                "type": "Color",
              },
            ],
            "type": "DropDollarPrefix<StyledTextProps>",
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
            "isOptional": false,
            "kind": "Array",
            "name": "exportedTypes",
            "type": {
              "kind": "Union",
              "name": "ExportedType",
              "properties": [
                {
                  "kind": "Intersection",
                  "name": undefined,
                  "properties": [
                    {
                      "kind": "Reference",
                      "type": "FunctionMetadata",
                    },
                    {
                      "kind": "Object",
                      "name": undefined,
                      "properties": [
                        {
                          "isOptional": false,
                          "kind": "String",
                          "name": "slug",
                          "type": "string",
                        },
                      ],
                      "type": "{ slug: string; }",
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
                      "type": "TypeMetadata",
                    },
                    {
                      "kind": "Object",
                      "name": undefined,
                      "properties": [
                        {
                          "isOptional": false,
                          "kind": "String",
                          "name": "slug",
                          "type": "string",
                        },
                      ],
                      "type": "{ slug: string; }",
                    },
                  ],
                  "type": "TypeMetadata & { slug: string; }",
                },
              ],
              "type": "ExportedType",
            },
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
            "parameters": [
              {
                "description": undefined,
                "isOptional": false,
                "kind": "Reference",
                "name": "color",
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
        "kind": "Function",
        "name": "Text",
        "signatures": [
          {
            "parameters": [
              {
                "description": undefined,
                "isOptional": true,
                "kind": "Interface",
                "name": "props",
                "properties": [
                  {
                    "isOptional": false,
                    "kind": "Reference",
                    "name": "color",
                    "type": "Color",
                  },
                ],
                "type": "TextProps",
              },
            ],
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
            "parameters": [
              {
                "description": undefined,
                "isOptional": false,
                "kind": "Reference",
                "name": "props",
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
})
