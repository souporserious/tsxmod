import { ImportDeclaration, SourceFile } from 'ts-morph'

/**
 * Gets an import declaration by its module specifier.
 *
 * @example
 * const importDeclaration = getImportDeclaration(sourceFile, 'react')
 */

export function getImportDeclaration(
  sourceFile: SourceFile,
  moduleSpecifier: string
): ImportDeclaration | undefined {
  return sourceFile.getImportDeclarations().find((importDeclaration) => {
    return importDeclaration.getModuleSpecifierValue() === moduleSpecifier
  })
}
