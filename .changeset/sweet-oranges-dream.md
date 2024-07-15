---
'@tsxmod/utils': minor
---

Removes `getTypeDocumentation` in favor of `processType`.

### Breaking Change

To update from `getTypeDocumentation` to `processType`, the signature changes slightly:

```ts
const functionDeclaration = sourceFile.getFunctionOrThrow('useCounter')

// Before
const typeDoc = getTypeDocumentation(functionDeclaration)

// After
const types = processType(functionDeclaration.getType(), functionDeclaration)
```
