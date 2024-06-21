import { JsxAttribute, Node } from 'ts-morph'
import { resolveLiteralExpression } from '../expressions'

/** Resolves the value of a JSX attribute into a literal value. */
export function resolveJsxAttributeValue(attribute: JsxAttribute) {
  const initializer = attribute.getInitializer()
  let value

  if (Node.isJsxExpression(initializer)) {
    const expression = initializer.getExpression()

    if (expression) {
      value = resolveLiteralExpression(expression)
    }
  } else if (Node.isStringLiteral(initializer)) {
    value = initializer.getLiteralValue()
  }

  return value
}
