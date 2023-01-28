import {
  JsxOpeningElement,
  JsxSelfClosingElement,
  Node,
  SyntaxKind,
} from 'ts-morph'

/** Get the first descendant JsxElement based on the identifier. */
export function getJsxElement(node: Node, name: string) {
  return getJsxElements(node).find(
    (node) =>
      node.getFirstDescendantByKindOrThrow(SyntaxKind.Identifier).getText() ===
      name
  )
}

/** Get all descendant JsxElement nodes. */
export function getJsxElements(node: Node) {
  return node
    .getDescendants()
    .filter(
      (node) => Node.isJsxElement(node) || Node.isJsxSelfClosingElement(node)
    ) as (JsxOpeningElement | JsxSelfClosingElement)[]
}
