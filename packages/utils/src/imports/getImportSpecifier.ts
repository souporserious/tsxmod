import { ImportSpecifier, SourceFile } from 'ts-morph'
import { getImportDeclaration } from './getImportDeclaration'

/**
 * Gets an import specifier by it's module and import name.
 *
 * @example
 * const importSpecifier = getImportSpecifier(sourceFile, 'react', 'useState')
 */

export function getImportSpecifier(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  importSpecifier: string
): ImportSpecifier | undefined {
  const importDeclaration = getImportDeclaration(sourceFile, moduleSpecifier)

  if (!importDeclaration) {
    return
  }

  return importDeclaration.getNamedImports().find((namedImport) => {
    return namedImport.getName() === importSpecifier
  })
}
