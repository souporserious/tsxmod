import { Project, SyntaxKind } from 'ts-morph'
import { findReferencesAsJsxElements } from './findReferencesAsJsxElements'

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
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!props.open) return null

  return (
    <dialog>
      {props.children}
      <Button onClick={props.onClose}>Close</Button>
    </dialog>
  )
}
`

const appSource = `
import React from 'react'
import { Button } from './Button'
import { Dialog } from './Dialog'

export default function App() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} children="Open" />
      <Dialog onClose={() => setOpen(false)} open={open} />
    </>
  )
}
`

test('finds all element references to a component', () => {
  const project = new Project({ useInMemoryFileSystem: true })

  const buttonSourceFile = project.createSourceFile('Button.tsx', buttonSource)

  project.createSourceFile('Dialog.tsx', dialogSource)
  project.createSourceFile('App.tsx', appSource)

  const componentIdentifier = buttonSourceFile
    .getVariableDeclarationOrThrow('Button')
    .getFirstDescendantByKindOrThrow(SyntaxKind.Identifier)
  const references = findReferencesAsJsxElements(componentIdentifier)

  expect(references.map((reference) => reference.getText())).toMatchSnapshot()
})
