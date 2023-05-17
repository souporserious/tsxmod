import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import { Project } from 'ts-morph'
import { getModuleSpecifierFilePath } from './getModuleSpecifierFilePath'

describe('getModuleSpecifierFilePath', () => {
  test('should return source file path when source file exists', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import testModule from './testModule'`
    )
    const moduleFile = project.createSourceFile(
      'testModule.ts',
      'export default {}'
    )
    const importDeclaration = sourceFile.getImportDeclarations()[0]

    const result = getModuleSpecifierFilePath(importDeclaration)
    expect(result).toBe(moduleFile.getFilePath())
  })

  test('should return resolved path based on tsconfig paths', () => {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        baseUrl: './',
        paths: {
          '@/lib/*': ['./lib/*'],
        },
      },
    })
    const sourceFile = project.createSourceFile(
      'test.ts',
      `import testModule from '@/lib/testModule'`
    )
    const moduleFile = project.createSourceFile(
      'lib/testModule.ts',
      'export default {}'
    )
    const importDeclaration = sourceFile.getImportDeclarations()[0]
    const result = getModuleSpecifierFilePath(importDeclaration)

    expect(result).toBe(moduleFile.getFilePath())
  })

  test('should return resolved path when source file is not a JavaScript file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-morph'))
    const srcDir = path.join(tmpDir, 'src')
    const libDir = path.join(tmpDir, 'lib')
    const srcFilePath = path.join(srcDir, 'test.ts')
    const cssFilePath = path.join(libDir, 'test.module.css')
    const tsConfigFilePath = path.join(tmpDir, 'tsconfig.json')

    fs.mkdirSync(srcDir)
    fs.mkdirSync(libDir)
    fs.writeFileSync(
      srcFilePath,
      `import aliasStyles from '@/lib/test.module.css'\nimport relativeStyles from '../lib/test.module.css'`
    )
    fs.writeFileSync(cssFilePath, `.test {}`)
    fs.writeFileSync(
      tsConfigFilePath,
      JSON.stringify({
        compilerOptions: {
          baseUrl: tmpDir,
          paths: {
            '@/lib/*': ['./lib/*'],
          },
        },
        include: ['**/*.ts'],
      })
    )

    const project = new Project({ tsConfigFilePath })
    const [importDeclarationAlias, importDeclarationRelative] = project
      .getSourceFile(srcFilePath)!
      .getImportDeclarations()
    const aliasResult = getModuleSpecifierFilePath(importDeclarationAlias)
    const relativeResult = getModuleSpecifierFilePath(importDeclarationRelative)

    expect(aliasResult).toBe(cssFilePath)
    expect(relativeResult).toBe(cssFilePath)

    fs.unlinkSync(srcFilePath)
    fs.unlinkSync(cssFilePath)
    fs.unlinkSync(tsConfigFilePath)
    fs.rmdirSync(srcDir)
    fs.rmdirSync(libDir)
    fs.rmdirSync(tmpDir)
  })
})
