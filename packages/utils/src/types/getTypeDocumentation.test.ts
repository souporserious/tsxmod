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
        "parameters": [
          {
            "defaultValue": "0",
            "description": "Provides the initial count.",
            "name": "initialCount",
            "required": false,
            "type": "number",
          },
        ],
        "returnType": "void",
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
        "parameters": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": undefined,
            "properties": [
              {
                "defaultValue": "0",
                "description": "Provides the initial count.",
                "name": "initialCount",
                "required": false,
                "tags": undefined,
                "type": "number",
              },
            ],
            "required": true,
            "type": "{ initialCount?: number; }",
          },
        ],
        "returnType": "void",
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
        "parameters": [
          {
            "defaultValue": "{}",
            "description": undefined,
            "name": undefined,
            "properties": [
              {
                "defaultValue": "{ count: 0 }",
                "description": undefined,
                "name": "initial",
                "properties": [
                  {
                    "defaultValue": undefined,
                    "description": undefined,
                    "name": "count",
                    "required": true,
                    "type": "number",
                  },
                ],
                "required": false,
                "type": "{ count: number }",
              },
            ],
            "required": false,
            "type": "{ initial?: {    count: number;}; }",
          },
        ],
        "returnType": "void",
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
        "parameters": [
          {
            "defaultValue": "0",
            "description": undefined,
            "name": "initialCount",
            "required": false,
            "type": "number",
          },
        ],
        "returnType": "void",
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
        "parameters": [
          {
            "defaultValue": "0",
            "description": undefined,
            "name": "initialCount",
            "required": false,
            "type": "number",
          },
        ],
        "returnType": "void",
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
        "parameters": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": undefined,
            "required": true,
            "type": "CounterOptions",
          },
        ],
        "returnType": "void",
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
        "parameters": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": undefined,
            "required": true,
            "type": "ReturnType<typeof useCounter>",
          },
        ],
        "returnType": "void",
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
        "kind": "Function",
        "name": "useCounterOverride",
        "parameters": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": undefined,
            "properties": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "name": "counterState",
                "required": true,
                "type": "ReturnType<typeof useCounter>",
              },
            ],
            "required": true,
            "type": "{ counterState: ReturnType<typeof useCounter>; }",
          },
        ],
        "returnType": "void",
        "type": "({ counterState }: { counterState: ReturnType<typeof useCounter>; }) => void",
      }
    `)
  })

  test('union types', () => {
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
        "kind": "Component",
        "name": "Component",
        "properties": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "color",
            "required": true,
            "type": "string",
          },
        ],
        "returnType": "void",
        "type": "(props: Props) => void",
      }
    `)
  })

  test('union types with primitive types', () => {
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
        "kind": "Component",
        "name": "Component",
        "properties": [],
        "returnType": "void",
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
      `import { BaseProps } from './types'; type Props = BaseProps & { source: string } | BaseProps & { value: string }; function Component(props: Props) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)

    expect(types).toMatchInlineSnapshot(`
      {
        "kind": "Component",
        "name": "Component",
        "properties": [
          {
            "required": true,
            "type": "BaseProps",
          },
        ],
        "returnType": "void",
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
        "kind": "Component",
        "name": "Text",
        "properties": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "className",
            "required": false,
            "type": "string",
          },
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "children",
            "required": true,
            "type": "ReactNode",
          },
          {
            "defaultValue": "'body1'",
            "description": undefined,
            "name": "variant",
            "required": false,
            "type": ""heading1" | "heading2" | "heading3" | "body1"",
          },
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "alignment",
            "required": false,
            "type": ""start" | "center" | "end"",
          },
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "width",
            "required": false,
            "type": "string | number",
          },
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "lineHeight",
            "required": false,
            "type": "string",
          },
        ],
        "returnType": "void",
        "type": "({ variant, alignment, width, lineHeight, children, }: TextProps) => void",
      }
    `)
  })

  test('library call expression generic types', () => {
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
        "kind": "Component",
        "name": "Grid",
        "properties": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "gridTemplateColumns",
            "required": true,
            "type": "string",
          },
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "gridTemplateRows",
            "required": false,
            "type": "string",
          },
        ],
        "returnType": "JSX.Element",
        "type": "IStyledComponentBase<"web", Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, GridProps>> & string",
      }
    `)
  })

  test('library tagged template literal generic types', () => {
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
        "kind": "Component",
        "name": "Grid",
        "properties": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "$gridTemplateColumns",
            "required": true,
            "type": "string",
          },
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "$gridTemplateRows",
            "required": true,
            "type": "string",
          },
        ],
        "returnType": "JSX.Element",
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
        "kind": "TypeAlias",
        "name": "Props",
        "properties": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "variant",
            "required": true,
            "type": "'heading1' | 'heading2' | 'heading3' | 'body1' | 'body2'",
          },
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "width",
            "required": false,
            "type": "string | number",
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
        "kind": "Interface",
        "name": "Props",
        "properties": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "variant",
            "required": true,
            "type": "'heading1' | 'heading2' | 'heading3' | 'body1' | 'body2'",
          },
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "width",
            "required": false,
            "type": "string | number",
          },
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "color",
            "required": true,
            "type": "string",
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
            "description": "Increments the count.",
            "modifier": "setter",
            "name": "accessorCount",
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "name": "value",
                "required": true,
                "type": "number",
              },
            ],
            "returnType": "number",
            "scope": undefined,
            "tags": undefined,
            "type": "number",
            "visibility": undefined,
          },
          {
            "description": "Returns the current count.",
            "modifier": "getter",
            "name": "accessorCount",
            "returnType": "number",
            "scope": undefined,
            "tags": undefined,
            "type": "number",
            "visibility": undefined,
          },
        ],
        "constructor": {
          "description": "Constructs a new counter.",
          "name": "constructor",
          "parameters": [
            {
              "defaultValue": "0",
              "description": undefined,
              "name": "initialCount",
              "required": false,
              "type": "number",
            },
          ],
          "tags": undefined,
        },
        "kind": "Class",
        "methods": [
          {
            "description": "Increments the count.",
            "modifier": undefined,
            "name": "increment",
            "parameters": [],
            "returnType": "void",
            "scope": undefined,
            "tags": undefined,
            "type": "() => void",
            "visibility": undefined,
          },
          {
            "description": "Decrements the count.",
            "modifier": undefined,
            "name": "decrement",
            "parameters": [],
            "returnType": "void",
            "scope": undefined,
            "tags": undefined,
            "type": "() => void",
            "visibility": undefined,
          },
          {
            "description": "Returns the current count.",
            "modifier": undefined,
            "name": "getCount",
            "parameters": [
              {
                "defaultValue": "true",
                "description": undefined,
                "name": "isFloored",
                "required": false,
                "type": "boolean",
              },
            ],
            "returnType": "number",
            "scope": undefined,
            "tags": undefined,
            "type": "(isFloored?: boolean) => number",
            "visibility": "public",
          },
          {
            "modifier": undefined,
            "name": "getStaticCount",
            "parameters": [],
            "returnType": "number",
            "scope": "static",
            "type": "() => number",
            "visibility": undefined,
          },
        ],
        "name": "Counter",
        "properties": [
          {
            "isReadonly": false,
            "name": "initialCount",
            "scope": undefined,
            "type": "number",
            "visibility": undefined,
          },
          {
            "isReadonly": false,
            "name": "staticCount",
            "scope": "static",
            "type": "number",
            "visibility": undefined,
          },
        ],
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
        "parameters": [
          {
            "defaultValue": "{}",
            "description": undefined,
            "name": undefined,
            "properties": [
              {
                "defaultValue": "0",
                "description": undefined,
                "name": "initialCount",
                "required": false,
                "type": "number",
              },
            ],
            "required": false,
            "type": "{ initialCount: number; }",
          },
        ],
        "returnType": "void",
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
        "parameters": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "a",
            "required": true,
            "type": "number",
          },
          {
            "defaultValue": "0",
            "description": undefined,
            "name": "b",
            "required": false,
            "type": "number",
          },
        ],
        "returnType": "number",
        "type": "(a: number, b?: number) => number",
      }
    `)
  })

  test('allows filtering specific node module types', () => {
    const project = new Project()
    const sourceFile = project.createSourceFile(
      'test.ts',
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
      (property) => {
        if (property.getName() === 'onClick') {
          return true
        }
        return !property.getSourceFile().isInNodeModules()
      }
    )

    expect(types).toMatchInlineSnapshot(`
      {
        "kind": "Component",
        "name": "Button",
        "properties": [
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "variant",
            "required": false,
            "type": "ButtonVariant",
          },
          {
            "defaultValue": undefined,
            "description": undefined,
            "name": "onClick",
            "required": false,
            "type": "MouseEventHandler<T> | undefined",
          },
        ],
        "returnType": "boolean",
        "type": "(props: ButtonProps) => boolean",
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
        "properties": [
          {
            "defaultValue": undefined,
            "description": "Controls how types are rendered.",
            "kind": "Function",
            "name": "children",
            "parameters": [
              {
                "defaultValue": undefined,
                "description": undefined,
                "name": "exportedTypes",
                "required": true,
                "type": "{ name: string; description: string; }[]",
              },
            ],
            "required": false,
            "returnType": "React.ReactNode",
            "tags": undefined,
            "type": "(exportedTypes: ReturnType<typeof getExportedTypes>) => React.ReactNode",
          },
        ],
        "returnType": "void",
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
          doc.parameters
          // @ts-expect-error - should not have accessors
          doc.accessors
        }
      })
  })
})
