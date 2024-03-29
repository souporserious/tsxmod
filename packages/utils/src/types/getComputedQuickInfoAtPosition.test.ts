import { Project, SyntaxKind } from 'ts-morph'
import { getComputedQuickInfoAtPosition } from './getComputedQuickInfoAtPosition'

export const complexSourceFileText = `
function getExportedTypes() {
    return undefined as unknown as { name: string, id: string, filePath: string }[]
}

function getExamplesFromSourceFile() {
    return undefined as unknown as { name: string, id: string }[]
}

type ModuleData = {
  title: string
  exportedTypes: (Omit<
    ReturnType<typeof getExportedTypes>[number],
    'filePath'
  > & {
    pathname: string
    sourcePath: string
    isMainExport: boolean
  })[]
  examples: ReturnType<typeof getExamplesFromSourceFile>
}

type Headings = {
  id: any
  text: string
  depth: number
}[]

type Module = {
  pathname: string
  frontMatter?: Record<string, any>
  headings: Headings
  metadata?: { title: string; description: string }
} & Omit<ModuleData, 'mdxPath' | 'tsPath' | 'examples'>

export async function getData<T>() {
  return undefined as unknown as Module & T
}
`

describe('getComputedQuickInfoAtPosition', () => {
  const project = new Project()

  it('should return computed quick info at a position in a source file', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type Intersected = { a: number; } & { b: number; } & { c: number; };`,
      { overwrite: true }
    )
    const position = sourceFile
      .getDescendantsOfKind(SyntaxKind.Identifier)
      .find((identifier) => identifier.getText() === 'Intersected')!
      .getStart()
    const result = getComputedQuickInfoAtPosition(sourceFile, position)
    const resultText = result?.displayParts?.map((part) => part.text).join('')

    expect(resultText).toMatchInlineSnapshot(`
      "type Intersected = {
          a: number;
          b: number;
          c: number;
      }"
    `)
  })

  it('should handle complex types', () => {
    const sourceFile = project.createSourceFile(
      'nested/path.ts',
      complexSourceFileText
    )
    const position = sourceFile
      .getDescendantsOfKind(SyntaxKind.Identifier)
      .find((identifier) => identifier.getText() === 'Module')!
      .getStart()
    const result = getComputedQuickInfoAtPosition(sourceFile, position)
    const resultText = result?.displayParts?.map((part) => part.text).join('')

    expect(resultText).toMatchInlineSnapshot(`
      "type Module = {
          pathname: string;
          frontMatter?: {
              [x: string]: any;
          };
          headings: {
              id: any;
              text: string;
              depth: number;
          }[];
          metadata?: {
              title: string;
              description: string;
          };
          title: string;
          exportedTypes: {
              id: string;
              name: string;
              pathname: string;
              sourcePath: string;
              isMainExport: boolean;
          }[];
      }"
    `)
  })

  it('handles external types', () => {
    project.createSourceFile(
      'node_modules/complex/index.d.ts',
      complexSourceFileText
    )
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import { getData } from 'complex'; const data = await getData();`,
      { overwrite: true }
    )
    const position = sourceFile.getVariableDeclarationOrThrow('data').getStart()
    const result = getComputedQuickInfoAtPosition(sourceFile, position)
    const resultText = result?.displayParts?.map((part) => part.text).join('')

    expect(resultText).toMatchInlineSnapshot(`
      "const data: {
          pathname: string;
          frontMatter?: {
              [x: string]: any;
          };
          headings: {
              id: any;
              text: string;
              depth: number;
          }[];
          metadata?: {
              title: string;
              description: string;
          };
          title: string;
          exportedTypes: {
              id: string;
              name: string;
              pathname: string;
              sourcePath: string;
              isMainExport: boolean;
          }[];
      }"
    `)
  })
})
