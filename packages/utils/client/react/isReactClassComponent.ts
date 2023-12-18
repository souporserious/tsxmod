import type { ClassDeclaration } from 'ts-morph'

/** Determines if a node is a React class component. */
export function isReactClassComponent(node: ClassDeclaration): boolean {
  const heritageClauses = node.getHeritageClauses()
  return heritageClauses.some((clause) => {
    return clause.getTypeNodes().some((typeNode) => {
      const typeName = typeNode.getExpression().getText()
      return (
        typeName === 'React.Component' || typeName === 'React.PureComponent'
      )
    })
  })
}
