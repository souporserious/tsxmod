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
    const libDir = path.join(tmpDir, 'lib')
    const moduleFilePath = path.join(tmpDir, 'lib', 'test.module.css')
    const sourceFilePath = path.join(tmpDir, 'test.ts')
    const tsConfigFilePath = path.join(tmpDir, 'tsconfig.json')

    fs.mkdirSync(libDir)
    fs.writeFileSync(moduleFilePath, `.test {}`)
    fs.writeFileSync(
      sourceFilePath,
      `import styles from '@/lib/test.module.css'`
    )
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
    const sourceFile = project.getSourceFile(sourceFilePath)!
    const importDeclaration = sourceFile.getImportDeclarations()[0]
    const result = getModuleSpecifierFilePath(importDeclaration)

    expect(result).toBe(moduleFilePath)

    fs.unlinkSync(moduleFilePath)
    fs.unlinkSync(sourceFilePath)
    fs.unlinkSync(tsConfigFilePath)
    fs.rmdirSync(path.join(tmpDir, 'lib'))
    fs.rmdirSync(tmpDir)
  })
})
