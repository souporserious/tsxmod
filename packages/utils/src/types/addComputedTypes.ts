import type { SourceFile } from 'ts-morph'
import { SyntaxKind } from 'ts-morph'

const ComputeTypeDeclarationText = `
type _Primitive = string | number | bigint | boolean | symbol | undefined | null;
type _BuiltInObject = Date | RegExp | Set<any> | Map<any, any> | WeakSet<any> | WeakMap<any, any> | Promise<any> | Error | ArrayBuffer | SharedArrayBuffer | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
type _Compute<Type> = Type extends Function | _Primitive | _BuiltInObject
  ? Type
  : { [Key in keyof Type]: _Compute<Type[Key]> } & {};
`

/**
 * Modifies a source file to add computed types to all eligible type aliases and interfaces.
 *
 * **Note:** This function requires lib files to be present in the project to work correctly.
 */
export function addComputedTypes(sourceFile: SourceFile) {
  const project = sourceFile.getProject()

  if (!project.getSourceFile('compute.d.ts')) {
    project.createSourceFile('compute.d.ts', ComputeTypeDeclarationText)
  }

  sourceFile.getTypeAliases().forEach((typeAlias) => {
    if (typeAlias.getName() === '_Compute') {
      return
    }

    const typeNode = typeAlias.getTypeNodeOrThrow()

    if (typeNode.getText().startsWith('_Compute<')) {
      return
    }

    if (
      typeNode.getKind() === SyntaxKind.IntersectionType ||
      typeNode.getKind() === SyntaxKind.MappedType ||
      typeNode.getKind() === SyntaxKind.TypeLiteral
    ) {
      typeAlias.setType(`_Compute<${typeNode.getText()}>`)
    }
  })

  sourceFile.getInterfaces().forEach((interfaceDeclaration) => {
    const originalInterfaceName = interfaceDeclaration.getName()
    const interfaceName = `_${originalInterfaceName}`

    interfaceDeclaration.getNameNode().replaceWithText(interfaceName)

    sourceFile.insertTypeAlias(interfaceDeclaration.getChildIndex() + 1, {
      name: originalInterfaceName,
      type: `_Compute<${interfaceName}>`,
      isExported: interfaceDeclaration.isExported(),
    })
  })
}
