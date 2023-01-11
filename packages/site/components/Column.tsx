import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type ColumnProps<T extends ElementType> = {
  as?: T
  children: ReactNode
  gap?: number
}

export function Column<T extends ElementType = 'div'>({
  as,
  children,
  gap,
  className,
  style,
  ...props
}: ColumnProps<T> & ComponentPropsWithoutRef<T>) {
  const Element = as || 'div'
  return (
    <Element
      className={['Column', className].filter(Boolean).join(' ')}
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
