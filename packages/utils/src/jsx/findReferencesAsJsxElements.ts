import { Identifier, Node } from 'ts-morph'

/**
 * Traces component references.
 *
 * This is similar to `findReferencesAsNodes` but returns JsxSelfClosingElement and JsxElement nodes.
 */
export function findReferencesAsJsxElements(identifer: Identifier): Node[] {
  const jsxElements: Node[] = []

  for (const reference of identifer.findReferencesAsNodes()) {
    const isJsxOpeningOrSelfClosingElement = Boolean(
      reference.getFirstAncestor((node) => {
        return (
          Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node)
        )
      })
    )

    if (isJsxOpeningOrSelfClosingElement) {
      jsxElements.push(
        reference.getFirstAncestorOrThrow((node) => {
          return Node.isJsxElement(node) || Node.isJsxSelfClosingElement(node)
        })
      )
    }
  }

  return jsxElements
}
