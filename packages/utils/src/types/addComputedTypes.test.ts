import { Project } from 'ts-morph'
import { addComputedTypes } from './addComputedTypes'

describe('addComputedTypes', () => {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      lib: ['lib.esnext.full.d.ts'],
    },
  })

  it('wraps exisiting object type with Computed type', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type ObjectType = { a: number; b: number; c: number; };`,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    const result = sourceFile.getFullText()

    expect(result).toMatchInlineSnapshot(
      `"export type ObjectType = _Compute<{ a: number; b: number; c: number; }>;"`
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
      `"export type MappedType = _Compute<{ [Key in string]: number; }>;"`
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
      `"export type Intersected = _Compute<{ a: number; } & { b: number; } & { c: number; }>;"`
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

      type InterfaceA = _Compute<_InterfaceA>;

             interface _InterfaceB extends InterfaceA { b: number; }

      type InterfaceB = _Compute<_InterfaceB>;

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

  it('does not compute built-in object types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `export type PublishedDate = Date;`,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    expect(
      sourceFile.getTypeAliasOrThrow('PublishedDate').getType().getText()
    ).toMatch('Date')
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
      `export type Intersected = _Compute<{ a: number; } & { b: number; } & { c: number; }>;`,
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

  it('preserves complex built-in types', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      type Foo = { bar: 'baz' } & { beep: 'boop' }
      type AsyncFoo = Promise<Foo>
      `,
      { overwrite: true }
    )
    addComputedTypes(sourceFile)

    const result = sourceFile
      .getTypeAliasOrThrow('AsyncFoo')
      .getType()
      .getText()

    expect(result).toMatchInlineSnapshot(
      `"Promise<{ bar: "baz"; beep: "boop"; }>"`
    )
  })
})
