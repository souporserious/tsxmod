import { Project, SyntaxKind } from 'ts-morph'
import { findClosestComponentDeclaration } from './findClosestComponentDeclaration'

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

  React.useEffect(() => {
    console.log({ open })
  }, [open])

  return (
    <>
      <Button onClick={() => setOpen(true)} children="Open" />
      <Dialog onClose={() => setOpen(false)} open={open} />
    </>
  )
}
`

test('finds the closest component to a node', () => {
  const project = new Project({ useInMemoryFileSystem: true })

  const buttonSourceFile = project.createSourceFile('Button.tsx', buttonSource)
  const buttonJsxElementIdentifier = buttonSourceFile.getFirstDescendantOrThrow(
    (node) => node.getText() === 'button'
  )

  expect(
    findClosestComponentDeclaration(buttonJsxElementIdentifier)!.getText()
  ).toMatchSnapshot()

  const dialogSourceFile = project.createSourceFile('Dialog.tsx', dialogSource)
  const dialogJsxElementIdentifier = dialogSourceFile.getFirstDescendantOrThrow(
    (node) => node.getText() === 'dialog'
  )

  expect(
    findClosestComponentDeclaration(dialogJsxElementIdentifier)!.getText()
  ).toMatchSnapshot()

  const appSourceFile = project.createSourceFile('App.tsx', appSource)
  const searchLine = 10 // <Button />

  for (const node of appSourceFile.getStatements()) {
    const startLine = node.getStartLineNumber()
    const endLine = node.getEndLineNumber()

    if (searchLine >= startLine && searchLine <= endLine) {
      const identifier = node.getFirstDescendantByKindOrThrow(
        SyntaxKind.Identifier
      )

      expect(
        findClosestComponentDeclaration(identifier)!.getText()
      ).toMatchSnapshot()
    }
  }
})
