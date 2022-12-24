import { Project } from 'ts-morph'

/** Generates type declarations from a project. */
export async function getTypeDeclarationsFromProject(project: Project) {
  const result = project.emitToMemory()
  const declarationFiles = result.getFiles().map((file) => ({
    path: file.filePath.replace(process.cwd(), 'file:///node_modules'),
    code: file.text,
  }))

  return declarationFiles
}
