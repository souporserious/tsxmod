import {
  ComputedPropertyName,
  Expression,
  JsxElement,
  JsxOpeningElement,
  JsxSelfClosingElement,
  Node,
  SyntaxKind,
} from 'ts-morph'

/** Get all possible class names for a JSX element. */
export function getClassNamesForJsxElement(
  jsxElement: JsxElement | JsxOpeningElement | JsxSelfClosingElement
): string[] {
  const allClassNames: string[][] = []
  const element = Node.isJsxElement(jsxElement)
    ? jsxElement.getOpeningElement()
    : jsxElement
  const classAttribute = element.getAttribute('className')

  if (Node.isJsxAttribute(classAttribute)) {
    const classNames: string[] = []
    let initializer = classAttribute.getInitializer()! as
      | ReturnType<typeof classAttribute.getInitializer>
      | Expression

    if (Node.isJsxExpression(initializer)) {
      initializer = initializer.getExpression()
    }

    processExpressionOrLiteral(initializer, classNames)

    allClassNames.push(classNames)
  }

  return allClassNames.flat()
}

function processExpressionOrLiteral(
  expression: Expression | undefined,
  classNames: string[]
): void {
  if (!expression) {
    return
  }

  if (
    Node.isStringLiteral(expression) ||
    Node.isNoSubstitutionTemplateLiteral(expression)
  ) {
    classNames.push(expression.getLiteralText())
  } else if (Node.isArrayLiteralExpression(expression)) {
    expression.getElements().forEach((element) => {
      processExpressionOrLiteral(element, classNames)
    })
  } else if (Node.isConditionalExpression(expression)) {
    processExpressionOrLiteral(expression.getWhenTrue(), classNames)
    processExpressionOrLiteral(expression.getWhenFalse(), classNames)
  } else if (Node.isBinaryExpression(expression)) {
    const operatorToken = expression.getOperatorToken()
    const rightExpression = expression.getRight()

    // Handle logical AND operator: condition && className
    if (operatorToken.getKind() === SyntaxKind.AmpersandAmpersandToken) {
      // Here we assume that the right side of the expression
      // is a PropertyAccessExpression or ElementAccessExpression
      // denoting a className, we ignore the condition on the left side
      processExpressionOrLiteral(rightExpression, classNames)
    }
  } else if (Node.isObjectLiteralExpression(expression)) {
    expression.getProperties().forEach((property) => {
      if (Node.isPropertyAssignment(property)) {
        const initializer = property.getInitializer()
        if (Node.isComputedPropertyName(property.getNameNode())) {
          const computedProperty =
            property.getNameNode() as ComputedPropertyName
          const expression = computedProperty.getExpression()

          // Handle case of identifier being accessed on object (styles['padded'])
          if (Node.isElementAccessExpression(expression)) {
            const argumentExpression = expression.getArgumentExpression()
            if (Node.isStringLiteral(argumentExpression)) {
              classNames.push(argumentExpression.getLiteralText())
            }
          }
          // Handle case of identifier being a true literal or binary expression
          else if (
            Node.isTrueLiteral(initializer) ||
            Node.isBinaryExpression(initializer)
          ) {
            // If the expression is a PropertyAccessExpression, only push the name of the property
            if (Node.isPropertyAccessExpression(expression)) {
              classNames.push(expression.getName())
            } else {
              classNames.push(property.getName())
            }
          }
        }
      }
    })
  } else if (Node.isIdentifier(expression)) {
    const definitions = expression.getDefinitions()

    if (definitions.length > 0) {
      const lastDefinition = definitions[definitions.length - 1]
      const variable = lastDefinition.getDeclarationNode()

      if (Node.isVariableDeclaration(variable)) {
        processExpressionOrLiteral(variable.getInitializer(), classNames)
      }
    }
  } else if (Node.isElementAccessExpression(expression)) {
    const argumentExpression = expression.getArgumentExpression()
    if (Node.isPropertyAccessExpression(argumentExpression)) {
      classNames.push(argumentExpression.getName())
    } else if (Node.isStringLiteral(argumentExpression)) {
      classNames.push(argumentExpression.getLiteralText())
    }
  } else if (Node.isCallExpression(expression)) {
    expression.getArguments().forEach((argument) => {
      if (Node.isExpression(argument)) {
        processExpressionOrLiteral(argument, classNames)
      } else {
        console.warn(
          `
Unhandled argument: ${argument.getKindName()}
text: ${argument.getText()}
path: ${argument.getSourceFile().getFilePath()}`.trim()
        )
      }
    })
  } else if (Node.isPropertyAccessExpression(expression)) {
    classNames.push(expression.getName())
  } else {
    console.warn(
      `
Unhandled expression: ${expression.getKindName()} 
text: ${expression.getText()}
path: ${expression.getSourceFile().getFilePath()}`.trim()
    )
  }
}
