import { Project } from 'ts-morph'
import { getPropTypes } from './getPropTypes'

test('returns prop types for a React element', () => {
  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile(
    'test.tsx',
    `
    import React from 'react'

    type Props = {
      foo: string
    }

    export const Component = (props: Props) => {
      return <div />
    }
    `
  )
  const component = sourceFile.getVariableDeclarationOrThrow('Component')
  const propTypes = getPropTypes(component)

  expect(propTypes).toMatchSnapshot()
})
