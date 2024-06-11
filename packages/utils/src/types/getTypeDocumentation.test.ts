import dedent from 'dedent'
import { Project, SyntaxKind } from 'ts-morph'
import { getTypeDocumentation } from './getTypeDocumentation'

describe('getTypeDocumentation', () => {
  const project = new Project()

  test('should parse a function with parameters', () => {
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
        "description": null,
        "name": "useCounter",
        "parameters": [
          {
            "defaultValue": "0",
            "description": "Provides the initial count.",
            "name": "initialCount",
            "properties": null,
            "required": false,
            "text": "number",
          },
        ],
      }
    `)
  })

  test('should parse a function with an object parameter', () => {
    const description = 'Provides the initial count.'
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function useCounter({ initialCount = 0 }: {\n/** ${description} */ initialCount?: number }) {}`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('useCounter')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "description": null,
        "name": "useCounter",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": null,
            "properties": [
              {
                "defaultValue": "0",
                "description": "Provides the initial count.",
                "name": "initialCount",
                "properties": null,
                "required": false,
                "text": "number",
              },
            ],
            "required": true,
            "text": "{ initialCount?: number; }",
          },
        ],
      }
    `)
  })

  test('should parse a function with an object parameter with a nested object', () => {
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
        "description": null,
        "name": "useCounter",
        "parameters": [
          {
            "defaultValue": "{}",
            "description": null,
            "name": null,
            "properties": [
              {
                "defaultValue": "{ count: 0 }",
                "description": null,
                "name": "initial",
                "properties": [
                  {
                    "defaultValue": undefined,
                    "description": null,
                    "name": "count",
                    "properties": null,
                    "required": true,
                    "text": "number",
                  },
                ],
                "required": false,
                "text": "{ count: number }",
              },
            ],
            "required": false,
            "text": "{ initial?: {    count: number;}; }",
          },
        ],
      }
    `)
  })

  test('should parse arrow function parameters', () => {
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
        "description": null,
        "name": "useCounter",
        "parameters": [
          {
            "defaultValue": "0",
            "description": null,
            "name": "initialCount",
            "properties": null,
            "required": false,
            "text": "number",
          },
        ],
      }
    `)
  })

  test('should parse function expression parameters', () => {
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
        "description": null,
        "name": "useCounter",
        "parameters": [
          {
            "defaultValue": "0",
            "description": null,
            "name": "initialCount",
            "properties": null,
            "required": false,
            "text": "number",
          },
        ],
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
        "description": null,
        "name": "useCounter",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": null,
            "properties": null,
            "required": true,
            "text": "CounterOptions",
          },
        ],
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
        "description": null,
        "name": "useCounterOverride",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": null,
            "properties": null,
            "required": true,
            "text": "ReturnType<typeof useCounter>",
          },
        ],
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
        "description": null,
        "name": "useCounterOverride",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": null,
            "properties": [
              {
                "defaultValue": undefined,
                "description": null,
                "name": "counterState",
                "properties": null,
                "required": true,
                "text": "ReturnType<typeof useCounter>",
              },
            ],
            "required": true,
            "text": "{ counterState: ReturnType<typeof useCounter>; }",
          },
        ],
      }
    `)
  })

  test('handles union types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `type BaseProps = { color: string }; type Props = BaseProps & { source: string } | BaseProps & { value: string }; function Component(props: Props) {}`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('Component')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "description": null,
        "name": "Component",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": "props",
            "properties": [
              {
                "defaultValue": undefined,
                "description": null,
                "name": "color",
                "properties": null,
                "required": true,
                "text": "string",
              },
            ],
            "required": true,
            "text": "Props",
            "unionProperties": [
              [
                {
                  "defaultValue": undefined,
                  "description": null,
                  "name": "source",
                  "properties": null,
                  "required": true,
                  "text": "string",
                },
              ],
              [
                {
                  "defaultValue": undefined,
                  "description": null,
                  "name": "value",
                  "properties": null,
                  "required": true,
                  "text": "string",
                },
              ],
            ],
          },
        ],
      }
    `)
  })

  test('handles union types with primitive types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `type Props = { color: string } | string; function Component(props: Props) {}`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getFunctionOrThrow('Component')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "description": null,
        "name": "Component",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": "props",
            "properties": [],
            "required": true,
            "text": "Props",
            "unionProperties": [
              [
                {
                  "defaultValue": undefined,
                  "description": null,
                  "name": null,
                  "properties": null,
                  "required": true,
                  "text": "string",
                },
              ],
              [
                {
                  "defaultValue": undefined,
                  "description": null,
                  "name": "color",
                  "properties": null,
                  "required": true,
                  "text": "string",
                },
              ],
            ],
          },
        ],
      }
    `)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)

    expect(types).toMatchInlineSnapshot(`
      {
        "description": null,
        "name": "Component",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": "props",
            "properties": [
              {
                "defaultValue": undefined,
                "description": null,
                "name": null,
                "properties": null,
                "required": true,
                "text": "BaseProps",
              },
            ],
            "required": true,
            "text": "Props",
            "unionProperties": [
              [
                {
                  "defaultValue": undefined,
                  "description": null,
                  "name": "source",
                  "properties": null,
                  "required": true,
                  "text": "string",
                },
              ],
              [
                {
                  "defaultValue": undefined,
                  "description": null,
                  "name": "value",
                  "properties": null,
                  "required": true,
                  "text": "string",
                },
              ],
            ],
          },
        ],
      }
    `)
  })

  test('handles mapped types', () => {
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
      
      export const Text = ({
        variant = 'body1',
        alignment,
        width,
        lineHeight,
        children,
      }: TextProps) => {}`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('Text')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "description": null,
        "name": "Text",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": null,
            "properties": [
              {
                "defaultValue": undefined,
                "description": null,
                "name": "className",
                "properties": null,
                "required": false,
                "text": "string",
              },
              {
                "defaultValue": undefined,
                "description": null,
                "name": "children",
                "properties": null,
                "required": true,
                "text": "ReactNode",
              },
              {
                "defaultValue": "'body1'",
                "description": null,
                "name": "variant",
                "properties": null,
                "required": false,
                "text": ""heading1" | "heading2" | "heading3" | "body1"",
              },
              {
                "defaultValue": undefined,
                "description": null,
                "name": "alignment",
                "properties": null,
                "required": true,
                "text": ""start" | "center" | "end"",
              },
              {
                "defaultValue": undefined,
                "description": null,
                "name": "width",
                "properties": null,
                "required": true,
                "text": "string | number",
              },
              {
                "defaultValue": undefined,
                "description": null,
                "name": "lineHeight",
                "properties": null,
                "required": true,
                "text": "string",
              },
            ],
            "required": true,
            "text": "TextProps",
          },
        ],
      }
    `)
  })

  test('handles library call expression generic types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      dedent`
      import styled from 'styled-components'

      export type GridProps = {
        gridTemplateColumns: string
        gridTemplateRows?: string
      }

      export const Grid = styled.div<GridProps>((props) => ({
        display: 'grid',
        gridTemplateColumns: props.gridTemplateColumns,
        gridTemplateRows: props.gridTemplateRows,
      }))
      `,
      { overwrite: true }
    )
    const types = getTypeDocumentation(
      sourceFile.getVariableDeclarationOrThrow('Grid')
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "description": null,
        "name": "Grid",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": "props",
            "properties": [
              {
                "defaultValue": undefined,
                "description": null,
                "name": "gridTemplateColumns",
                "properties": null,
                "required": true,
                "text": "string",
              },
              {
                "defaultValue": undefined,
                "description": null,
                "name": "gridTemplateRows",
                "properties": null,
                "required": false,
                "text": "string",
              },
            ],
            "required": true,
            "text": "PolymorphicComponentProps<R, BaseProps, AsTarget, ForwardedAsTarget, AsTarget extends any ? React.ComponentPropsWithRef<AsTarget> : {}, ForwardedAsTarget extends any ? React.ComponentPropsWithRef<...> : {}>",
          },
        ],
      }
    `)
  })

  test('handles library tagged template literal generic types', () => {
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
        "description": null,
        "name": "Grid",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": "props",
            "properties": [
              {
                "defaultValue": undefined,
                "description": null,
                "name": "$gridTemplateColumns",
                "properties": null,
                "required": true,
                "text": "string",
              },
              {
                "defaultValue": undefined,
                "description": null,
                "name": "$gridTemplateRows",
                "properties": null,
                "required": true,
                "text": "string",
              },
            ],
            "required": true,
            "text": "PolymorphicComponentProps<R, BaseProps, AsTarget, ForwardedAsTarget, AsTarget extends any ? React.ComponentPropsWithRef<AsTarget> : {}, ForwardedAsTarget extends any ? React.ComponentPropsWithRef<...> : {}>",
          },
        ],
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
        "description": null,
        "name": "Props",
        "properties": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": "variant",
            "properties": null,
            "required": true,
            "text": "'heading1' | 'heading2' | 'heading3' | 'body1' | 'body2'",
          },
          {
            "defaultValue": undefined,
            "description": null,
            "name": "width",
            "properties": null,
            "required": false,
            "text": "string | number",
          },
        ],
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
        "description": null,
        "name": "Props",
        "properties": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": "variant",
            "properties": null,
            "required": true,
            "text": "'heading1' | 'heading2' | 'heading3' | 'body1' | 'body2'",
          },
          {
            "defaultValue": undefined,
            "description": null,
            "name": "width",
            "properties": null,
            "required": false,
            "text": "string | number",
          },
          {
            "defaultValue": undefined,
            "description": null,
            "name": "color",
            "properties": null,
            "required": true,
            "text": "string",
          },
        ],
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

        /** Increments the count. */
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
            "description": "Increments the count.
      Returns the current count.",
            "modifier": "setter",
            "name": "accessorCount",
            "parameters": [
              {
                "defaultValue": undefined,
                "description": null,
                "name": "value",
                "properties": null,
                "required": true,
                "text": "number",
              },
            ],
            "returnType": "number",
            "scope": null,
            "text": "number",
            "visibility": null,
          },
          {
            "description": "Increments the count.
      Returns the current count.",
            "modifier": "getter",
            "name": "accessorCount",
            "returnType": "number",
            "scope": null,
            "text": "number",
            "visibility": null,
          },
        ],
        "constructor": {
          "description": "Constructs a new counter.",
          "name": "constructor",
          "parameters": [
            {
              "defaultValue": "0",
              "description": null,
              "name": "initialCount",
              "properties": null,
              "required": false,
              "text": "number",
            },
          ],
        },
        "description": null,
        "methods": [
          {
            "description": "Increments the count.",
            "modifier": null,
            "name": "increment",
            "parameters": [],
            "returnType": "void",
            "scope": null,
            "text": "() => void",
            "visibility": null,
          },
          {
            "description": "Decrements the count.",
            "modifier": null,
            "name": "decrement",
            "parameters": [],
            "returnType": "void",
            "scope": null,
            "text": "() => void",
            "visibility": null,
          },
          {
            "description": "Returns the current count.",
            "modifier": null,
            "name": "getCount",
            "parameters": [
              {
                "defaultValue": "true",
                "description": null,
                "name": "isFloored",
                "properties": null,
                "required": false,
                "text": "boolean",
              },
            ],
            "returnType": "number",
            "scope": null,
            "text": "(isFloored?: boolean) => number",
            "visibility": "public",
          },
          {
            "description": null,
            "modifier": null,
            "name": "getStaticCount",
            "parameters": [],
            "returnType": "number",
            "scope": "static",
            "text": "() => number",
            "visibility": null,
          },
        ],
        "name": "Counter",
        "properties": [
          {
            "description": null,
            "isReadonly": false,
            "name": "initialCount",
            "scope": null,
            "text": "number",
            "visibility": null,
          },
          {
            "description": null,
            "isReadonly": false,
            "name": "staticCount",
            "scope": "static",
            "text": "number",
            "visibility": null,
          },
        ],
      }
    `)
  })

  test('handles renamed property default values', () => {
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
        "description": null,
        "name": "useCounter",
        "parameters": [
          {
            "defaultValue": "{}",
            "description": null,
            "name": null,
            "properties": [
              {
                "defaultValue": "0",
                "description": null,
                "name": "initialCount",
                "properties": null,
                "required": false,
                "text": "number",
              },
            ],
            "required": false,
            "text": "{ initialCount: number; }",
          },
        ],
      }
    `)
  })

  test('handles multiple arguments', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function add(a: number, b: number = 0): number { return a + b }`,
      { overwrite: true }
    )
    const types = getTypeDocumentation(sourceFile.getFunctionOrThrow('add'))

    expect(types).toMatchInlineSnapshot(`
      {
        "description": null,
        "name": "add",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": null,
            "name": "a",
            "properties": null,
            "required": true,
            "text": "number",
          },
          {
            "defaultValue": "0",
            "description": null,
            "name": "b",
            "properties": null,
            "required": false,
            "text": "number",
          },
        ],
      }
    `)
  })
})
