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
        "kind": "Function",
        "name": "useCounter",
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": 0,
                "description": "Provides the initial count.",
                "isOptional": false,
                "kind": "Number",
                "name": "initialCount",
                "type": "number",
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
        "kind": "Function",
        "name": "useCounter",
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
                "isOptional": false,
                "kind": "Object",
                "name": undefined,
                "properties": [
                  {
                    "defaultValue": 0,
                    "description": "Provides the initial count.",
                    "isOptional": true,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "initialCount",
                    "tags": undefined,
                    "type": "number",
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
        "kind": "Function",
        "name": "useCounter",
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
                "isOptional": true,
                "kind": "Object",
                "name": undefined,
                "properties": [
                  {
                    "defaultValue": {
                      "count": 0,
                    },
                    "isOptional": true,
                    "isReadonly": false,
                    "kind": "Object",
                    "name": "initial",
                    "properties": [
                      {
                        "defaultValue": 0,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "Number",
                        "name": "count",
                        "type": "number",
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
        "kind": "Function",
        "name": "useCounter",
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": 0,
                "description": undefined,
                "isOptional": false,
                "kind": "Number",
                "name": "initialCount",
                "type": "number",
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
        "kind": "Function",
        "name": "useCounter",
        "signatures": [
          {
            "kind": "FunctionSignature",
            "modifier": undefined,
            "parameters": [
              {
                "defaultValue": 0,
                "description": undefined,
                "isOptional": false,
                "kind": "Number",
                "name": "initialCount",
                "type": "number",
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
        "kind": "Function",
        "name": "useCounter",
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
                "isOptional": false,
                "kind": "Reference",
                "name": undefined,
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
        "kind": "Function",
        "name": "useCounterOverride",
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
                "isOptional": false,
                "kind": "Reference",
                "name": undefined,
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

    // TODO: below is not correct since it should preserve the ReturnType because the argument itself is a reference that should be linked

    expect(types).toMatchInlineSnapshot(`
      {
        "kind": "Function",
        "name": "useCounterOverride",
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
                "name": undefined,
                "properties": [
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Reference",
                    "name": "counterState",
                    "type": "{ initialCount: number; }",
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
        "kind": "Component",
        "name": "Component",
        "signatures": [
          {
            "kind": "ComponentSignature",
            "modifier": undefined,
            "properties": {
              "defaultValue": undefined,
              "description": undefined,
              "isOptional": false,
              "kind": "Union",
              "members": [
                {
                  "kind": "Object",
                  "name": undefined,
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "color",
                      "type": "string",
                    },
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "source",
                      "type": "string",
                    },
                  ],
                  "type": "BaseProps & { source: string; }",
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
                      "name": "color",
                      "type": "string",
                    },
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "value",
                      "type": "string",
                    },
                  ],
                  "type": "BaseProps & { value: string; }",
                },
              ],
              "name": "props",
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
        "kind": "Function",
        "name": "Component",
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
                        "kind": "String",
                        "name": "color",
                        "type": "string",
                      },
                    ],
                    "type": "{ color: string; }",
                  },
                ],
                "name": "props",
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
        "kind": "Function",
        "name": "Component",
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
                    "kind": "Intersection",
                    "name": undefined,
                    "properties": [
                      {
                        "kind": "Reference",
                        "type": "BaseProps",
                      },
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "source",
                        "type": "string",
                      },
                    ],
                    "type": "BaseProps & { source: string; }",
                  },
                  {
                    "kind": "Intersection",
                    "name": undefined,
                    "properties": [
                      {
                        "kind": "Reference",
                        "type": "BaseProps",
                      },
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "value",
                        "type": "string",
                      },
                    ],
                    "type": "BaseProps & { value: string; }",
                  },
                ],
                "name": "props",
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
    getTypeDocumentation(sourceFile.getTypeAliasOrThrow('TextProps'))
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('Text')
    )

    // TODO: follow references to accurately determine the type and process as a component

    expect(types).toMatchInlineSnapshot(`
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
                  "variant": "body1",
                },
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
        "kind": "Intersection",
        "name": undefined,
        "properties": [
          {
            "kind": "Component",
            "name": "Grid",
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
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "gridTemplateColumns",
                      "type": "string",
                    },
                    {
                      "defaultValue": undefined,
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "gridTemplateRows",
                      "type": "string",
                    },
                  ],
                  "type": "Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, GridProps>",
                },
                "returnType": "ReactNode",
                "type": "(props: Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, GridProps>) => ReactNode",
              },
            ],
            "type": "IStyledComponentBase<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, GridProps>>",
          },
          {
            "kind": "String",
            "name": "Grid",
            "type": "string",
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
        "kind": "Intersection",
        "name": undefined,
        "properties": [
          {
            "kind": "Component",
            "name": "Grid",
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
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "$gridTemplateColumns",
                      "type": "string",
                    },
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "$gridTemplateRows",
                      "type": "string",
                    },
                  ],
                  "type": "Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, { $gridTemplateColumns: string; $gridTemplateRows: string; }>",
                },
                "returnType": "ReactNode",
                "type": "(props: Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, { $gridTemplateColumns: string; $gridTemplateRows: string; }>) => ReactNode",
              },
            ],
            "type": "IStyledComponentBase<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, { $gridTemplateColumns: string; $gridTemplateRows: string; }>>",
          },
          {
            "kind": "String",
            "name": "Grid",
            "type": "string",
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
        "kind": "Object",
        "name": "Props",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Union",
            "members": [
              {
                "kind": "String",
                "name": undefined,
                "type": ""heading1"",
              },
              {
                "kind": "String",
                "name": undefined,
                "type": ""heading2"",
              },
              {
                "kind": "String",
                "name": undefined,
                "type": ""heading3"",
              },
              {
                "kind": "String",
                "name": undefined,
                "type": ""body1"",
              },
              {
                "kind": "String",
                "name": undefined,
                "type": ""body2"",
              },
            ],
            "name": "variant",
            "type": ""heading1" | "heading2" | "heading3" | "body1" | "body2"",
          },
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
            "name": "width",
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
        "kind": "Object",
        "name": "Props",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Union",
            "members": [
              {
                "kind": "String",
                "name": undefined,
                "type": ""heading1"",
              },
              {
                "kind": "String",
                "name": undefined,
                "type": ""heading2"",
              },
              {
                "kind": "String",
                "name": undefined,
                "type": ""heading3"",
              },
              {
                "kind": "String",
                "name": undefined,
                "type": ""body1"",
              },
              {
                "kind": "String",
                "name": undefined,
                "type": ""body2"",
              },
            ],
            "name": "variant",
            "type": ""heading1" | "heading2" | "heading3" | "body1" | "body2"",
          },
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
            "name": "width",
            "type": "string | number",
          },
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "String",
            "name": "color",
            "type": "string",
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
        "kind": "Enum",
        "members": {
          "Blue": "BLUE",
          "Green": "GREEN",
          "Red": "RED",
        },
        "name": "Colors",
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
                "isOptional": false,
                "kind": "Number",
                "name": "value",
                "type": "number",
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
                "isOptional": false,
                "kind": "Number",
                "name": "initialCount",
                "type": "number",
              },
            ],
            "returnType": "Counter",
            "type": "(initialCount: number) => Counter",
          },
        ],
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
                    "isOptional": true,
                    "kind": "Boolean",
                    "name": "isFloored",
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
        "properties": [
          {
            "defaultValue": 0,
            "isReadonly": false,
            "kind": "Number",
            "name": "initialCount",
            "scope": undefined,
            "type": "number",
            "visibility": undefined,
          },
          {
            "defaultValue": 0,
            "isReadonly": false,
            "kind": "Number",
            "name": "staticCount",
            "scope": "static",
            "type": "number",
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
        "kind": "Function",
        "name": "useCounter",
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
                "isOptional": false,
                "kind": "Object",
                "name": undefined,
                "properties": [
                  {
                    "defaultValue": 0,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "initialCount",
                    "type": "number",
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
        "kind": "Function",
        "name": "add",
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
                "defaultValue": 0,
                "description": undefined,
                "isOptional": false,
                "kind": "Number",
                "name": "b",
                "type": "number",
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
        "kind": "Union",
        "members": [
          {
            "kind": "Object",
            "name": undefined,
            "properties": [
              {
                "defaultValue": undefined,
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "color",
                "type": "string",
              },
              {
                "defaultValue": undefined,
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "backgroundColor",
                "type": "string",
              },
            ],
            "type": "{ color: string; } & { backgroundColor: string; }",
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
                "name": "color",
                "type": "string",
              },
              {
                "defaultValue": undefined,
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "borderColor",
                "type": "string",
              },
            ],
            "type": "{ color: string; } & { borderColor: string; }",
          },
        ],
        "name": "ButtonVariants",
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
        "kind": "Object",
        "name": "Config",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "String",
            "name": "siteName",
            "type": "string",
          },
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "Union",
            "members": [
              {
                "kind": "Object",
                "name": undefined,
                "properties": [
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "apiEndpoint",
                    "type": "string",
                  },
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "apiKey",
                    "type": "string",
                  },
                ],
                "type": "{ apiEndpoint: string; apiKey: string; }",
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
                    "name": "dbHost",
                    "type": "string",
                  },
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "Number",
                    "name": "dbPort",
                    "type": "number",
                  },
                  {
                    "defaultValue": undefined,
                    "isOptional": false,
                    "isReadonly": false,
                    "kind": "String",
                    "name": "dbName",
                    "type": "string",
                  },
                ],
                "type": "{ dbHost: string; dbPort: number; dbName: string; }",
              },
            ],
            "name": "settings",
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
        "kind": "Function",
        "name": "useCounter",
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
                    "kind": "Object",
                    "name": undefined,
                    "properties": [
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "apiEndpoint",
                        "type": "string",
                      },
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "apiKey",
                        "type": "string",
                      },
                    ],
                    "type": "{ apiEndpoint: string; apiKey: string; }",
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
                        "name": "dbHost",
                        "type": "string",
                      },
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "Number",
                        "name": "dbPort",
                        "type": "number",
                      },
                      {
                        "defaultValue": undefined,
                        "isOptional": false,
                        "isReadonly": false,
                        "kind": "String",
                        "name": "dbName",
                        "type": "string",
                      },
                    ],
                    "type": "{ dbHost: string; dbPort: number; dbName: string; }",
                  },
                ],
                "name": "settings",
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
        "kind": "Component",
        "name": "Button",
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
                  "kind": "Union",
                  "members": [
                    {
                      "kind": "String",
                      "name": undefined,
                      "type": ""primary"",
                    },
                    {
                      "kind": "String",
                      "name": undefined,
                      "type": ""secondary"",
                    },
                    {
                      "kind": "String",
                      "name": undefined,
                      "type": ""danger"",
                    },
                  ],
                  "name": "variant",
                  "type": "ButtonVariant",
                },
                {
                  "defaultValue": undefined,
                  "isOptional": true,
                  "isReadonly": false,
                  "kind": "Function",
                  "name": "onClick",
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
                          "name": "event",
                          "type": "MouseEvent<HTMLButtonElement, globalThis.MouseEvent>",
                        },
                      ],
                      "returnType": "void",
                      "type": "(event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => void",
                    },
                  ],
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
        "kind": "Component",
        "name": "ExportedTypes",
        "signatures": [
          {
            "kind": "ComponentSignature",
            "modifier": undefined,
            "properties": {
              "defaultValue": undefined,
              "description": undefined,
              "isOptional": false,
              "kind": "Union",
              "members": [
                {
                  "kind": "Object",
                  "name": undefined,
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "source",
                      "type": "string",
                    },
                    {
                      "defaultValue": undefined,
                      "description": "Controls how types are rendered.",
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "Function",
                      "name": "children",
                      "signatures": [
                        {
                          "kind": "FunctionSignature",
                          "modifier": undefined,
                          "parameters": [
                            {
                              "defaultValue": undefined,
                              "description": undefined,
                              "element": {
                                "kind": "Object",
                                "name": undefined,
                                "properties": [
                                  {
                                    "defaultValue": undefined,
                                    "isOptional": false,
                                    "isReadonly": false,
                                    "kind": "String",
                                    "name": "name",
                                    "type": "string",
                                  },
                                  {
                                    "defaultValue": undefined,
                                    "isOptional": false,
                                    "isReadonly": false,
                                    "kind": "String",
                                    "name": "description",
                                    "type": "string",
                                  },
                                ],
                                "type": "{ name: string; description: string; }",
                              },
                              "isOptional": false,
                              "kind": "Array",
                              "name": "exportedTypes",
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
                  "kind": "Object",
                  "name": undefined,
                  "properties": [
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "filename",
                      "type": "string",
                    },
                    {
                      "defaultValue": undefined,
                      "isOptional": false,
                      "isReadonly": false,
                      "kind": "String",
                      "name": "value",
                      "type": "string",
                    },
                    {
                      "defaultValue": undefined,
                      "description": "Controls how types are rendered.",
                      "isOptional": true,
                      "isReadonly": false,
                      "kind": "Function",
                      "name": "children",
                      "signatures": [
                        {
                          "kind": "FunctionSignature",
                          "modifier": undefined,
                          "parameters": [
                            {
                              "defaultValue": undefined,
                              "description": undefined,
                              "element": {
                                "kind": "Object",
                                "name": undefined,
                                "properties": [
                                  {
                                    "defaultValue": undefined,
                                    "isOptional": false,
                                    "isReadonly": false,
                                    "kind": "String",
                                    "name": "name",
                                    "type": "string",
                                  },
                                  {
                                    "defaultValue": undefined,
                                    "isOptional": false,
                                    "isReadonly": false,
                                    "kind": "String",
                                    "name": "description",
                                    "type": "string",
                                  },
                                ],
                                "type": "{ name: string; description: string; }",
                              },
                              "isOptional": false,
                              "kind": "Array",
                              "name": "exportedTypes",
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
        "kind": "Union",
        "members": [
          {
            "kind": "Reference",
            "type": "InterfaceMetadata",
          },
          {
            "kind": "Object",
            "name": "TypeAliasMetadata",
            "properties": [
              {
                "defaultValue": undefined,
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "kind",
                "type": ""TypeAlias"",
              },
              {
                "defaultValue": undefined,
                "isOptional": false,
                "isReadonly": false,
                "kind": "String",
                "name": "name",
                "type": "string",
              },
            ],
            "type": "TypeAliasMetadata",
          },
        ],
        "name": "AllMetadata",
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
        "kind": "Number",
        "name": "initialCount",
        "tags": [
          {
            "tagName": "internal",
            "text": "only for internal use",
          },
        ],
        "type": "0",
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
        "kind": "Object",
        "name": "colors",
        "properties": [
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "String",
            "name": "primary",
            "type": ""#ff0000"",
          },
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "String",
            "name": "secondary",
            "type": ""#00ff00"",
          },
          {
            "defaultValue": undefined,
            "isOptional": false,
            "isReadonly": false,
            "kind": "String",
            "name": "tertiary",
            "type": ""#0000ff"",
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
          "kind": "Number",
          "name": "awaited",
          "type": "number",
        },
        "counterTypes": {
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
          "properties": [
            {
              "defaultValue": 0,
              "isReadonly": false,
              "kind": "Number",
              "name": "count",
              "scope": undefined,
              "type": "number",
              "visibility": undefined,
            },
          ],
          "type": "Counter",
        },
        "promiseTypes": {
          "arguments": [
            {
              "kind": "Number",
              "name": undefined,
              "type": "number",
            },
          ],
          "kind": "Generic",
          "name": "promise",
          "type": "Promise<number>",
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
