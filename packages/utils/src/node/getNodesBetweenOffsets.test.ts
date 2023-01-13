import { Project } from 'ts-morph'
import { getNodesBetweenOffsets } from './getNodesBetweenOffsets'

const testSource = `
const a = 1
const b = 2
const c = 3
`.trim()

test('gets nodes within an offset range', () => {
  const project = new Project()
  const sourceFile = project.createSourceFile('test.ts', testSource)
  const nodes = getNodesBetweenOffsets(sourceFile, 11, 23)

  expect(nodes.length).toBe(4)
  expect(nodes.map((node) => node.getText())).toMatchSnapshot()
})
