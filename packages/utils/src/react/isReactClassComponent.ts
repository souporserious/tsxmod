import type { ClassDeclaration } from 'ts-morph'
import { Node, SyntaxKind } from 'ts-morph'

/** Determines if a node is a React class component. */
export function isReactClassComponent(node: ClassDeclaration): boolean {
  const extendsClause = node
    .getHeritageClauses()
    .find((clause) => clause.getToken() === SyntaxKind.ExtendsKeyword)

  if (extendsClause) {
    const extendedTypes = extendsClause.getTypeNodes()

    for (const typeNode of extendedTypes) {
      const typeName = typeNode.getText()

      // Direct match (e.g., extends React.Component)
      if (
        typeName === 'React.Component' ||
        typeName === 'React.PureComponent'
      ) {
        return true
      }

      // Check if the extended type is an imported symbol from React
      if (Node.isExpressionWithTypeArguments(typeNode)) {
        const expression = typeNode.getExpression()

        if (Node.isIdentifier(expression)) {
          const importSpecifier = expression.getSymbol()?.getDeclarations()[0]

          return (
            Node.isImportSpecifier(importSpecifier) &&
            importSpecifier.getImportDeclaration().getModuleSpecifierValue() ===
              'react'
          )
        }
      }
    }
  }

  return false
}
