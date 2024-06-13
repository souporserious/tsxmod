import { Project } from 'ts-morph'
import { addComputedTypes } from './addComputedTypes'

describe('addComputedTypes', () => {
  const project = new Project()

  it('wraps exisiting object type with Computed type', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type ObjectType = { a: number; b: number; c: number; };`,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    const result = sourceFile.getFullText()

    expect(result).toMatchInlineSnapshot(
      `"export type ObjectType = Compute<{ a: number; b: number; c: number; }>;"`
    )
  })

  it('wraps exisiting mapped type with Computed type', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type MappedType = { [Key in string]: number; };`,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    const result = sourceFile.getFullText()

    expect(result).toMatchInlineSnapshot(
      `"export type MappedType = Compute<{ [Key in string]: number; }>;"`
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

  it('replaces interfaces with Computed type', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `interface InterfaceA { a: number; }
       interface InterfaceB extends InterfaceA { b: number; }
       const createSource = <T>(source: T) => source;
       const source = createSource<InterfaceB>({ a: 1, b: 2 });
      `,
      { overwrite: true }
    )

    addComputedTypes(sourceFile)

    expect(sourceFile.getFullText()).toMatchInlineSnapshot(`
      "interface _InterfaceA { a: number; }

      type InterfaceA = Compute<_InterfaceA>;

             interface _InterfaceB extends InterfaceA { b: number; }

      type InterfaceB = Compute<_InterfaceB>;

             const createSource = <T>(source: T) => source;
             const source = createSource<InterfaceB>({ a: 1, b: 2 });
            "
    `)

    expect(
      sourceFile.getTypeAliasOrThrow('InterfaceB').getType().getText()
    ).toMatchInlineSnapshot(`"{ b: number; a: number; }"`)
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

  it('does not wrap built-in object types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type PublishedDate = Date;`,
      { overwrite: true }
    )
    const beforeSourceFileText = sourceFile.getFullText()

    addComputedTypes(sourceFile)

    expect(beforeSourceFileText).toMatch(sourceFile.getFullText())
  })

  it('skips built-in object types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `type Title = string;\ntype AuthorsMeta = { authors: Map<string, string>; }\nexport type ObjectType = { title: Title; date: Date; } & AuthorsMeta;`,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    const type = sourceFile
      .getTypeAliasOrThrow('ObjectType')
      .getType()
      .getText()

    expect(type).toMatchInlineSnapshot(
      `"{ title: string; date: Date; authors: Map<string, string>; }"`
    )
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

  it('flattens types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `type Tags = string[]
       type Shared = { tags?: Tags }
       type FrontMatter = { title: string; date: Date; summary?: string; } & Shared
      `,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    const result = sourceFile
      .getTypeAliasOrThrow('FrontMatter')
      .getType()
      .getText()

    expect(result).toMatchInlineSnapshot(
      `"{ title: string; date: Date; summary?: string; tags?: string[]; }"`
    )
  })
})
