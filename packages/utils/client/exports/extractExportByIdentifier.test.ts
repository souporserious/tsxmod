import { readFileSync } from 'fs'
import { Project } from 'ts-morph'
import { extractExportByIdentifier } from './extractExportByIdentifier'

const kitchenSinkSource = readFileSync('fixtures/kitchen-sink.tsx', 'utf8')

test('extracts export and dependencies', () => {
  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('test.tsx', kitchenSinkSource)
  const codeString = extractExportByIdentifier(sourceFile, 'Box')

  expect(codeString).toMatchSnapshot()
})
