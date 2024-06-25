import { Project } from 'ts-morph'
import { processTypeProperties, processType } from './processType'

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

  export type FunctionType = (param1: string, param2: number) => Promise<ExportedType>;

  const foo = async () => {
    return {
      slug: 'foo',
      filePath: 'bar',
    }
  }

  export type ComplexType = {
    promiseObject: Promise<ExportedType>;
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
            "kind": "Function",
            "name": "method",
            "signatures": [
              {
                "parameters": [
                  {
                    "description": undefined,
                    "kind": "Object",
                    "name": "parameterValue",
                    "properties": [
                      {
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
            "type": "(parameterValue: { objectValue: number; }) => Promise<number>",
          },
          {
            "kind": "Array",
            "name": "exportedTypes",
            "type": {
              "kind": "Object",
              "name": "ExportedType",
              "properties": [
                {
                  "kind": "String",
                  "name": "slug",
                  "type": "string",
                },
                {
                  "kind": "String",
                  "name": "filePath",
                  "type": "string",
                },
              ],
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
          "kind": "Promise",
          "name": "promiseObject",
          "type": {
            "kind": "Object",
            "name": "ExportedType",
            "properties": [
              {
                "kind": "String",
                "name": "slug",
                "type": "string",
              },
              {
                "kind": "String",
                "name": "filePath",
                "type": "string",
              },
            ],
            "type": "ExportedType",
          },
        },
        {
          "kind": "Promise",
          "name": "promiseFunction",
          "type": {
            "kind": "Function",
            "name": undefined,
            "signatures": [
              {
                "parameters": [
                  {
                    "description": undefined,
                    "kind": "Number",
                    "name": "a",
                    "type": "number",
                  },
                  {
                    "description": undefined,
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
        },
        {
          "kind": "Promise",
          "name": "promiseVariable",
          "type": {
            "kind": "Object",
            "name": undefined,
            "properties": [
              {
                "kind": "String",
                "name": "slug",
                "type": "string",
              },
              {
                "kind": "String",
                "name": "filePath",
                "type": "string",
              },
            ],
            "type": "{ slug: string; filePath: string; }",
          },
        },
        {
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
                  "kind": "Number",
                  "name": "b",
                  "type": "number",
                },
                {
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
          "kind": "Intersection",
          "name": "intersection",
          "properties": [
            {
              "kind": "Object",
              "name": undefined,
              "properties": [
                {
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
          "kind": "Intersection",
          "name": "complexIntersection",
          "properties": [
            {
              "kind": "Promise",
              "type": {
                "kind": "Object",
                "name": "ExportedType",
                "properties": [
                  {
                    "kind": "String",
                    "name": "slug",
                    "type": "string",
                  },
                  {
                    "kind": "String",
                    "name": "filePath",
                    "type": "string",
                  },
                ],
                "type": "ExportedType",
              },
            },
            {
              "kind": "Object",
              "name": undefined,
              "properties": [
                {
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
          "kind": "Tuple",
          "name": "tuple",
          "type": "[a: string, b: number, string]",
        },
        {
          "kind": "Function",
          "name": "function",
          "signatures": [
            {
              "parameters": [
                {
                  "description": undefined,
                  "kind": "String",
                  "name": "param1",
                  "type": "string",
                },
                {
                  "description": undefined,
                  "kind": "Number",
                  "name": "param2",
                  "type": "number",
                },
              ],
              "returnType": "Promise<ExportedType>",
              "type": "(param1: string, param2: number) => Promise<ExportedType>",
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
                    "kind": "String",
                    "name": "backgroundColor",
                    "type": "string",
                  },
                ],
                "type": "{ backgroundColor: string; }",
              },
              {
                "kind": "Object",
                "name": "BaseVariant",
                "properties": [
                  {
                    "kind": "String",
                    "name": "color",
                    "type": "string",
                  },
                ],
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
                    "kind": "String",
                    "name": "borderColor",
                    "type": "string",
                  },
                ],
                "type": "{ borderColor: string; }",
              },
              {
                "kind": "Object",
                "name": "BaseVariant",
                "properties": [
                  {
                    "kind": "String",
                    "name": "color",
                    "type": "string",
                  },
                ],
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
        /* no js doc */
        bool: boolean;
        /** Accepts a string */
        func: (
          /** a string parameter */
          a: string,
        ) => void;
        arr: string[];
        obj: Record<string, any>;
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
            "kind": "String",
            "name": "str",
            "tags": undefined,
            "type": "string",
          },
          {
            "description": "
      a number",
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
            "kind": "Boolean",
            "name": "bool",
            "type": "boolean",
          },
          {
            "description": "Accepts a string",
            "kind": "Function",
            "name": "func",
            "signatures": [
              {
                "parameters": [
                  {
                    "description": "a string parameter",
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
            "kind": "Array",
            "name": "arr",
            "type": {
              "kind": "String",
              "type": "string",
            },
          },
          {
            "kind": "Object",
            "name": "obj",
            "properties": [],
            "type": "Record<string, any>",
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
            "kind": "Object",
            "name": "e",
            "properties": [
              {
                "kind": "Number",
                "name": "f",
                "type": "number",
              },
            ],
            "type": "{ f: number; }",
          },
          {
            "kind": "String",
            "name": "g",
            "type": "string",
          },
          {
            "kind": "Literal",
            "name": "b",
            "type": "1",
          },
          {
            "kind": "Literal",
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
            "kind": "String",
            "name": "id",
            "type": "string",
          },
          {
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
})
