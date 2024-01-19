# @tsxmod/utils

## 0.3.1

### Patch Changes

- 836a321: Use explicitly defined exports.

## 0.3.0

### Minor Changes

- 298edc5: Remove server specific utilities.
- 86b0ab3: Rename `getFunctionParameterTypes` to `getTypeDocumentation`.
- bba6f87: Use type argument properties if no parameter apparent properties found in `getFunctionParameterTypes`.

## 0.2.0

### Minor Changes

- 7ee088a: Add type guard to `isJsxComponent`.
- eafbbab: Widen `isJsxComponent` parameter type to `Node`.
- 7a23b6b: Add support for passing `VariableDeclaration` to `isJsxComponent`.
- d723513: Narrow `getReactFunctionDeclaration` return type to `ArrowFunction | FunctionDeclaration | FunctionExpression`.
- 0ffd87c: Add union properties to `getFunctionParameterTypes`.
- 7086726: Remove `undefined` from `isForwardRefExpression` parameter.
- 7f66fe0: Rename type metadata `type` field to `text`.
- 2d2c4e4: Handle generic library type documentation in `getFunctionParameterTypes`.
- 05aacd5: Uses a simpler check for `isJsxComponent` to determine if a function is a component while also adding support for class components.
- 5bafb2e: Improve `isReactClassComponent` check for specific React imports.

### Patch Changes

- d9faa4d: Fix missing function property types when analyzing mapped types.
- d46611b: Use a type guard for `isForwardRefExpression`.
- 8d60ea9: Fix `isJsxComponent` determining if function expression is a JSX component.

## 0.1.0

### Minor Changes

- e173180: Publish new utilities.
