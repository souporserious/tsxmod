import { ts, Symbol } from 'ts-morph'

/** Gets the tags from a symbol's JSDoc. */
export function getSymbolTags(symbol: Symbol) {
  return symbol.getJsDocTags().map((tag) => ({
    name: tag.getName(),
    text: ts.displayPartsToString(tag.getText()),
  }))
}
