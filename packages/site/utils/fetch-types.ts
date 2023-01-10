import { setupTypeAcquisition } from '@typescript/ata'
import { Project, ts } from 'ts-morph'

/** Fetches the types for a string of code. */
export async function fetchTypes(
  code: string
): Promise<{ code: string; path: string }[]> {
  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('index.ts', code)
  const moduleImportDeclarations = sourceFile.getImportDeclarations()
  const types = []

  return new Promise((resolve) => {
    const ata = setupTypeAcquisition({
      projectName: 'tsxmod',
      typescript: ts,
      delegate: {
        receivedFile: (code: string, path: string) => {
          types.push({ code, path: `file:///${path}` })
        },
        finished: () => {
          resolve(types)
        },
      },
    })

    moduleImportDeclarations.forEach((moduleImportDeclaration) => {
      ata(moduleImportDeclaration.getText())
    })
  })
}
