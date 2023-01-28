import { readFileSync } from 'fs'
import { Project } from 'ts-morph'
import { getJsxElement, getJsxElements } from './getJsxElements'

const dialogSource = readFileSync('fixtures/app/Dialog.tsx', 'utf8')
const appSource = readFileSync('fixtures/app/App.tsx', 'utf8')

test('traces component references to the root element', () => {
  const project = new Project({ useInMemoryFileSystem: true })
  const dialogSourceFile = project.createSourceFile('Dialog.tsx', dialogSource)
  const appSourceFile = project.createSourceFile('App.tsx', appSource)

  expect(
    getJsxElements(appSourceFile).map((node) => node.getText())
  ).toMatchSnapshot()

  expect(getJsxElement(dialogSourceFile, 'Button')?.getText()).toMatchSnapshot()
})
