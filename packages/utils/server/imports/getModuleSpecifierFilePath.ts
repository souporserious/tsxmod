import { ImportDeclaration } from 'ts-morph'
import * as tsconfigPaths from 'tsconfig-paths'
import * as path from 'node:path'

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
  const project = importDeclaration.getProject()
  const compilerOptions = project.compilerOptions.get()
  const baseUrl = compilerOptions.baseUrl || ''
  const basePath = compilerOptions.pathsBasePath || ''
  const paths = compilerOptions.paths || {}

  if (typeof baseUrl !== 'string') {
    throw new Error(
      `Expected compilerOptions.baseUrl to be a string, but got ${typeof baseUrl}`
    )
  }

  const absoluteBaseUrl = path.resolve(basePath as string, baseUrl)
  const matchPath = tsconfigPaths.createMatchPath(absoluteBaseUrl, paths)
  const resolvedPath = matchPath(
    moduleSpecifier,
    undefined,
    undefined,
    extensions
  )

  return resolvedPath
}
