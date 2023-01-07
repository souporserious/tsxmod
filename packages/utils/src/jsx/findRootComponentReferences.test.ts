import { Project } from 'ts-morph'
import { findRootComponentReferences } from './findRootComponentReferences'

const buttonSource = `
import React from 'react'

export const Button = (props: {
    onClick: () => void
    children: React.ReactNode
}) => {
    return <button onClick={props.onClick}>{props.children}</button>
}
`

const dialogSource = `
import React from 'react'
import { Button } from './Button'

export function Dialog(props: {
    onClose: () => void
    children: React.ReactNode
}) {
    return (
        <dialog>
            {props.children}
            <Button onClick={props.onClose}>Close</Button>
        </dialog>
    )
}
`

const pageSource = `
import React from 'react'
import { Dialog } from './Dialog'

export default function Page() {
    return <div><Dialog /></div>
}
`

test('traces component references to the root element', () => {
  const project = new Project({ useInMemoryFileSystem: true })

  const buttonSourceFile = project.createSourceFile('Button.tsx', buttonSource)

  project.createSourceFile('Dialog.tsx', dialogSource)
  project.createSourceFile('about.tsx', pageSource)
  project.createSourceFile('contact.tsx', pageSource)

  const component = buttonSourceFile.getVariableDeclarationOrThrow('Button')
  const references = findRootComponentReferences(component)

  expect(
    references.map((node) => node.getSourceFile().getFilePath())
  ).toMatchSnapshot()
})
