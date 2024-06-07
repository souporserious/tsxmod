# @tsxmod/utils

## 0.5.2

### Patch Changes

- 537efde: Fixes `addComputedTypes` not flattening interfaces.
- 389adf6: Fixes `addComputedTypes` not flattening property values that point to other types.

## 0.5.1

### Patch Changes

- 18dc524: Don't unfurl built-in types for `addComputedTypes`.

## 0.5.0

### Minor Changes

- d4ff47a: Add `hasJsDocTag` utility.

### Patch Changes

- cd01c40: Fix `getSymbolDescription` not parsing exported variable declaration comments correctly.

## 0.4.3

### Patch Changes

- 216346d: Fix external types when using `getComputedQuickInfoAtPosition` by also modifying external source files.

## 0.4.2

### Patch Changes

- 64d39c0: Skip existing computed types in `addComputedTypes`.
- 25bc458: Fix `getComputedQuickInfoAtPosition` returning `undefined` by passing full `filePath` to `getQuickInfoAtPosition`.

## 0.4.1

### Patch Changes

- bdd2ceb: Add return type for `getComputedQuickInfoAtPosition` to fix build error.
- b14a7e6: Re-export `addComputedTypes` and `getComputedQuickInfoAtPosition` from main export.

## 0.4.0

### Minor Changes

- ca26b21: Adds `getDiagnosticMessageText` utility for parsing diagnostic messages returned from `getPreEmitDiagnostics`.
- 247dd74: Adds `addComputedTypes` utility for adding a `Computed` utility type to a project that wraps type aliases in the provided source file.
- 195a001: Adds `getComputedQuickInfoAtPosition` utility to get the computed quick info at a source file position using the `Computed` utility type.

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
