import React from 'react'
import { Button } from 'theme-ui'
import { Dialog } from './Dialog'

export default function App() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    console.log({ open })
  }, [open])

  return (
    <>
      <Button onClick={() => setOpen(true)} children="Open" />
      <Dialog onClose={() => setOpen(false)} open={open}>
        Hello Dialog
      </Dialog>
    </>
  )
}
