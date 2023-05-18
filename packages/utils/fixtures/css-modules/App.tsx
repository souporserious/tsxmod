import React from 'react'
import clsx from 'clsx'
import styles from './App.module.css'

function Container({ padded }: { padded?: boolean }) {
  return (
    <div className={clsx(styles.container, { [styles['padded']]: padded })}>
      Hello World
    </div>
  )
}

export default function App() {
  return <Container padded />
}
