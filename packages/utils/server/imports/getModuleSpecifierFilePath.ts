import { ImportDeclaration } from 'ts-morph'
import * as tsconfigPaths from 'tsconfig-paths'
import * as path from 'node:path'
import * as fs from 'node:fs'

const defaultExtensions = ['.css', '.svg', '.json', '.md', '.mdx']

/** Resolves module specifier paths including non-JavaScript files. */
export function getModuleSpecifierFilePath(
  importDeclaration: ImportDeclaration,
  extensions: string[] = defaultExtensions
): string | undefined {
  const sourceFile = importDeclaration.getModuleSpecifierSourceFile()

  if (sourceFile) {
    return sourceFile.getFilePath()
  }

  const moduleSpecifier = importDeclaration.getModuleSpecifierValue()

  if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
    const resolvedPath = path.resolve(
      importDeclaration.getSourceFile().getDirectoryPath(),
      moduleSpecifier
    )

    if (fs.existsSync(resolvedPath)) {
      return resolvedPath
    }

    return undefined
  }

  const project = importDeclaration.getProject()
  const compilerOptions = project.compilerOptions.get()
  const baseUrl = compilerOptions.baseUrl || ''
  const basePath = compilerOptions.pathsBasePath || ''
  const paths = compilerOptions.paths || {}
  const absoluteBaseUrl = path.resolve(basePath as string, baseUrl)

  if (typeof baseUrl !== 'string') {
    throw new Error(
      `Expected compilerOptions.baseUrl to be a string, but got ${typeof baseUrl}`
    )
  }

  const matchPath = tsconfigPaths.createMatchPath(absoluteBaseUrl, paths)
  const resolvedPath = matchPath(
    moduleSpecifier,
    undefined,
    undefined,
    extensions
  )

  return resolvedPath
}
