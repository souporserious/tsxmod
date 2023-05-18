import { readFileSync } from 'fs'
import { Project } from 'ts-morph'
import { getJsxElements } from './getJsxElements'
import { getClassNamesForJsxElement } from './getClassNamesForJsxElement'

const appSource = readFileSync('fixtures/css-modules/App.tsx', 'utf8')

describe('getClassNamesForJsxElement', () => {
  it('should get class names from JSX', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const appSourceFile = project.createSourceFile('App.tsx', appSource)
    const [containerJsxElement] = getJsxElements(appSourceFile)
    const classNames = getClassNamesForJsxElement(containerJsxElement)

    expect(classNames).toEqual(['container', 'padded'])
  })

  it('should handle when className is a variable', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'Container.tsx',
      `const stackClassName = clsx(styles.stack, {
          [styles.debug]: process.env.NODE_ENV === 'development',
       })
       export const Container = <Stack className={stackClassName} />`
    )
    const [stackJsxElement] = getJsxElements(sourceFile)
    const classNames = getClassNamesForJsxElement(stackJsxElement)

    expect(classNames).toEqual(['stack', 'debug'])
  })

  it('should handle when className is a simple expression', () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile(
      'Container.tsx',
      `export const Container = <Stack
        direction="row"
        align="center"
        className={styles.active}
      />`
    )
    const [stackJsxElement] = getJsxElements(sourceFile)
    const classNames = getClassNamesForJsxElement(stackJsxElement)

    expect(classNames).toEqual(['active'])
  })

  it('should handle when className is an array or conditional', () => {
    const project = new Project()
    const sourceFile = project.createSourceFile(
      'Card.tsx',
      `
  import styles from  './card.module.css';
  import clsx from 'clsx';

  export function Card({ active, size, align }) {
    return <div className={clsx([
      active && styles.active,
      size === 'large' ? styles.large : styles.small,
      align === 'left' ? styles.left : styles.right,
    ])} />
  }
`
    )
    const [cardJsxElement] = getJsxElements(sourceFile)
    const classNames = getClassNamesForJsxElement(cardJsxElement)

    expect(classNames).toEqual(['active', 'large', 'small', 'left', 'right'])
  })
})
