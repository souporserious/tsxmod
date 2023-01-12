import React from 'react'

export const Button = (props: {
  onClick: () => void
  children: React.ReactNode
}) => {
  return <button onClick={props.onClick}>{props.children}</button>
}
