import { Project } from 'ts-morph'
import { watch } from 'chokidar'

export function createWatcher(
  project: Project,
  loaderPaths: string[],
  isSaving: { current: boolean },
  onUpdate: (path: string) => Promise<any>
) {
  const projectFiles = project
    .getSourceFiles()
    .map((sourceFile) => sourceFile.getFilePath())
  const watcher = watch(loaderPaths.concat(projectFiles), {
    ignoreInitial: true,
  })

  watcher.on('add', function (addedPath) {
    if (isSaving.current) return

    if (!loaderPaths.includes(addedPath)) {
      project.addSourceFileAtPath(addedPath)
    }

    onUpdate(addedPath)
  })

  watcher.on('unlink', function (removedPath) {
    if (isSaving.current) return

    if (!loaderPaths.includes(removedPath)) {
      const removedSourceFile = project.getSourceFile(removedPath)

      if (removedSourceFile) {
        project.removeSourceFile(removedSourceFile)
      }
    }

    onUpdate(removedPath)
  })

  watcher.on('change', async function (changedPath) {
    if (isSaving.current) return

    if (!loaderPaths.includes(changedPath)) {
      const changedSourceFile = project.getSourceFile(changedPath)

      if (changedSourceFile) {
        await changedSourceFile.refreshFromFileSystem()
      }
    }

    onUpdate(changedPath)
  })
}
