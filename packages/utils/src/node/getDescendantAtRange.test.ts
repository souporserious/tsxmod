import { Project } from 'ts-morph'
import { getDescendantAtRange } from './getDescendantAtRange'

const simpleSource = `
const a = 1
const b = 2
const c = 3
`.trim()

const complexSource = `
import React from 'react'

export function Button(props: {
    onClick: () => void
    children: React.ReactNode
}) {
    return <button onClick={props.onClick}>{props.children}</button>
}
`.trim()

test('gets nodes within an offset range', () => {
  const project = new Project()
  const simpleSourceFile = project.createSourceFile('simple.ts', simpleSource)
  const simpleNode = getDescendantAtRange(simpleSourceFile, [17, 18])

  expect(simpleNode.getText()).toMatchSnapshot()

  const complexSourceFile = project.createSourceFile(
    'complex.ts',
    complexSource
  )
  const functionText = 'function'
  const functionIndexStart = complexSource.indexOf(functionText)
  const functionIndexEnd = functionIndexStart + functionText.length - 1
  const complexNode = getDescendantAtRange(complexSourceFile, [
    functionIndexStart,
    functionIndexEnd,
  ])

  expect(complexNode.getText()).toMatchSnapshot()
})
