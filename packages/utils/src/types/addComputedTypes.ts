import type { SourceFile } from 'ts-morph'
import { SyntaxKind } from 'ts-morph'

const ComputeTypeDeclarationText = `
  type Compute<Type> = Type extends Function
    ? Type
    : {
        [Key in keyof Type]: Type[Key] extends object
          ? Compute<Type[Key]>
          : Type[Key];
      } & {};
  `

/** Modifies a source file to add computed types to all eligible type aliases. */
export function addComputedTypes(sourceFile: SourceFile) {
  const project = sourceFile.getProject()

  if (!project.getSourceFile('compute.d.ts')) {
    project.createSourceFile('compute.d.ts', ComputeTypeDeclarationText)
  }

  sourceFile.getTypeAliases().forEach((typeAlias) => {
    if (typeAlias.getName() === 'Compute') {
      return
    }

    const typeNode = typeAlias.getTypeNodeOrThrow()

    if (
      typeNode.getKind() === SyntaxKind.IntersectionType ||
      typeNode.getKind() === SyntaxKind.MappedType ||
      typeNode.getKind() === SyntaxKind.TypeLiteral
    ) {
      typeAlias.setType(`Compute<${typeNode.getText()}>`)
    }
  })
}
