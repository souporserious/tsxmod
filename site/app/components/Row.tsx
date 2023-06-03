import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type RowProps<T extends ElementType> = {
  as?: T
  children: ReactNode
  gap?: number
}

export function Row<T extends ElementType = 'div'>({
  as,
  children,
  gap,
  className,
  style,
  ...props
}: RowProps<T> & ComponentPropsWithoutRef<T>) {
  const Element = as || 'div'
  return (
    <Element
      className={['Row', className].filter(Boolean).join(' ')}
      style={{
        gap: `var(--space-${gap})`,
        ...style,
      }}
      {...props}
    >
      {children}
    </Element>
  )
}
