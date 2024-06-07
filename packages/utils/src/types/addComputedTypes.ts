import type { SourceFile } from 'ts-morph'
import { SyntaxKind } from 'ts-morph'

const ComputeTypeDeclarationText = `
type Primitive = string | number | bigint | boolean | symbol | undefined | null;
type BuiltInObject = Date | RegExp | Set<any> | Map<any, any> | WeakSet<any> | WeakMap<any, any> | Promise<any> | Error | ArrayBuffer | SharedArrayBuffer | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
type Compute<Type> = Type extends Function | Primitive | BuiltInObject
  ? Type
  : { [Key in keyof Type]: Compute<Type[Key]> } & {};
`

/** Modifies a source file to add computed types to all eligible type aliases and interfaces. */
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

    if (typeNode.getText().startsWith('Compute<')) {
      return
    }

    if (
      typeNode.getKind() === SyntaxKind.IntersectionType ||
      typeNode.getKind() === SyntaxKind.MappedType ||
      typeNode.getKind() === SyntaxKind.TypeLiteral
    ) {
      typeAlias.setType(`Compute<${typeNode.getText()}>`)
    }
  })

  sourceFile.getInterfaces().forEach((interfaceDeclaration) => {
    const originalInterfaceName = interfaceDeclaration.getName()
    const interfaceName = `_${originalInterfaceName}`

    interfaceDeclaration.rename(interfaceName)

    sourceFile.insertTypeAlias(interfaceDeclaration.getChildIndex() + 1, {
      name: originalInterfaceName,
      type: `Compute<${interfaceName}>`,
      isExported: interfaceDeclaration.isExported(),
    })
  })
}
