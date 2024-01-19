import { ts, Node, JsxElement, JsxSelfClosingElement } from 'ts-morph'

/** Renames JSX Element Identifier accounting for opening, closing, and self-closing elements. */
export function renameJsxIdentifier(
  jsxElement: JsxElement | JsxSelfClosingElement,
  identifier: string
): boolean {
  if (Node.isJsxSelfClosingElement(jsxElement)) {
    const jsxIdentifier = jsxElement.getFirstDescendantByKind(
      ts.SyntaxKind.Identifier
    )

    if (jsxIdentifier) {
      jsxIdentifier.rename(identifier)

      return true
    }

    return false
  }

  const openingJsxIdentifier = jsxElement
    .getOpeningElement()
    .getFirstDescendantByKind(ts.SyntaxKind.Identifier)
  const closingJsxIdentifier = jsxElement
    .getClosingElement()
    .getFirstDescendantByKind(ts.SyntaxKind.Identifier)

  if (openingJsxIdentifier && closingJsxIdentifier) {
    openingJsxIdentifier.rename(identifier)
    closingJsxIdentifier.rename(identifier)

    return true
  }

  return false
}
