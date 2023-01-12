import React from 'react'
import { Button, Card } from 'theme-ui'

export function Dialog(props: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!props.open) return null

  return (
    <dialog>
      <Card>{props.children}</Card>
      <Button onClick={props.onClose} variant="secondary">
        Close
      </Button>
    </dialog>
  )
}
