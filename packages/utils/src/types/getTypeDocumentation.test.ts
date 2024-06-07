import dedent from 'dedent'
import type { VariableDeclaration } from 'ts-morph'
import { Project, SyntaxKind } from 'ts-morph'
import { getTypeDocumentation } from './getTypeDocumentation'

describe('getTypeDocumentation', () => {
  const project = new Project()

  it('should parse a function with parameters', () => {
    const description = 'Provides the initial count.'
    const sourceFile = project.createSourceFile(
      'test.ts',
      `function useCounter(\n/** ${description} */ initialCount: number = 0) {}`,
      { overwrite: true }
    )
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.ArrowFunction
    )
    const types = getTypeDocumentation(functionDeclaration)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionExpression
    )
    const types = getTypeDocumentation(functionDeclaration)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)
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
    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.FunctionDeclaration
    )
    const types = getTypeDocumentation(functionDeclaration)
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

    const functionDeclaration = sourceFile.getFirstDescendantByKindOrThrow(
      SyntaxKind.ArrowFunction
    )
    const types = getTypeDocumentation(functionDeclaration)
    const [type] = types!

    expect(type.properties).toMatchInlineSnapshot(`
      [
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
      ]
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
    const variableDeclaration = sourceFile
      .getExportedDeclarations()
      .get('Grid')!
      .at(0)! as VariableDeclaration
    const initializer = variableDeclaration.getInitializerIfKindOrThrow(
      SyntaxKind.CallExpression
    )
    const types = getTypeDocumentation(initializer)

    expect(types).toMatchInlineSnapshot(`
      [
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
      ]
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
    const variableDeclaration = sourceFile.getVariableDeclarationOrThrow('Grid')
    const initializer = variableDeclaration.getInitializerIfKindOrThrow(
      SyntaxKind.TaggedTemplateExpression
    )
    const types = getTypeDocumentation(initializer)

    expect(types).toMatchInlineSnapshot(`
      [
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
      ]
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
    const typeAlias = sourceFile.getTypeAliasOrThrow('Props')
    const types = getTypeDocumentation(typeAlias)

    expect(types).toMatchInlineSnapshot(`
      [
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
      ]
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
    const interfaceDeclaration = sourceFile.getInterfaceOrThrow('Props')
    const types = getTypeDocumentation(interfaceDeclaration)

    expect(types).toMatchInlineSnapshot(`
      [
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
      ]
    `)
  })
})
