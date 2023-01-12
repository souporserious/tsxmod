import { readFileSync } from 'fs'
import { Project } from 'ts-morph'
import { findNamedImportReferences } from './findNamedImportReferences'

const dialogSource = readFileSync(
  'fixtures/app-with-library/Dialog.tsx',
  'utf8'
)
const appSource = readFileSync('fixtures/app-with-library/App.tsx', 'utf8')

test('get references for named import', () => {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      baseUrl: '.',
      paths: {
        'theme-ui': ['theme-ui.d.ts'],
      },
    },
  })

  project.createSourceFile('Dialog.tsx', dialogSource)
  project.createSourceFile('App.tsx', appSource)
  project.createSourceFile(
    'theme-ui.d.ts',
    `
      export const Button: any
      export const Card: any
    `
  )

  const references = findNamedImportReferences(project, 'theme-ui', 'Button')

  expect(
    references.map((reference) => reference.getParentOrThrow().getText())
  ).toMatchSnapshot()
})
