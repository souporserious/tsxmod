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
