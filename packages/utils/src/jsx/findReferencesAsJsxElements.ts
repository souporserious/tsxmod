import {
  Identifier,
  JsxOpeningElement,
  JsxSelfClosingElement,
  Node,
} from 'ts-morph'

/**
 * Traces component references.
 *
 * This is similar to `findReferencesAsNodes` but returns JsxSelfClosingElement and JsxElement nodes.
 * Note, this currently does not account for cases where the component is used as a prop or is renamed.
 */
export function findReferencesAsJsxElements(
  identifer: Identifier
): (JsxOpeningElement | JsxSelfClosingElement)[] {
  const jsxElements: Node[] = []

  for (const reference of identifer.findReferencesAsNodes()) {
    const node = reference.getFirstAncestor((node) => {
      return (
        Node.isJsxOpeningElement(node) || Node.isJsxSelfClosingElement(node)
      )
    })

    if (node) {
      jsxElements.push(node)
    }
  }

  return jsxElements as (JsxOpeningElement | JsxSelfClosingElement)[]
}
