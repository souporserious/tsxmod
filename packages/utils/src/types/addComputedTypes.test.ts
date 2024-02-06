import { Project } from 'ts-morph'
import { addComputedTypes } from './addComputedTypes'

describe('addComputedTypes', () => {
  const project = new Project()

  it('wraps exisiting literal type with Computed type', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type Intersected = { a: number; b: number; c: number; };`,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    const result = sourceFile.getFullText()

    expect(result).toMatchInlineSnapshot(
      `"export type Intersected = Compute<{ a: number; b: number; c: number; }>;"`
    )
  })

  it('wraps exisiting mapped type with Computed type', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type Intersected = { [Key in string]: number; };`,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    const result = sourceFile.getFullText()

    expect(result).toMatchInlineSnapshot(
      `"export type Intersected = Compute<{ [Key in string]: number; }>;"`
    )
  })

  it('wraps exisiting intersection type with Computed type', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type Intersected = { a: number; } & { b: number; } & { c: number; };`,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    const result = sourceFile.getFullText()

    expect(result).toMatchInlineSnapshot(
      `"export type Intersected = Compute<{ a: number; } & { b: number; } & { c: number; }>;"`
    )
  })

  it('does not wrap literal types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type UserId = number;`,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    const result = sourceFile.getFullText()

    expect(result).toMatchInlineSnapshot(`"export type UserId = number;"`)
  })

  it('skips existing Computed type', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type Intersected = Compute<{ a: number; } & { b: number; } & { c: number; }>;`,
      { overwrite: true }
    )
    const beforeSourceFileText = sourceFile.getFullText()

    addComputedTypes(sourceFile)

    expect(beforeSourceFileText).toMatch(sourceFile.getFullText())
  })
})
