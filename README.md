# tsxmod

Programmatically analyze and run transformations across TypeScript or JavaScript files using [TS Morph](https://ts-morph.com/).

## About

Codebases grow and change over time. As they do, it becomes more difficult to maintain and evolve them. This is especially true when you have a large codebase with many contributors. This is where codemods come in. Codemods are a way to make large-scale, non-trivial changes to codebases. They are a great way to refactor code, migrate to new APIs, and better understand your codebase.

## CLI

```bash
npx tsxmod <codemod> <files>
```

## Node

```ts
import { project } from 'tsxmod'

const files = project.getSourceFiles('src/**/*.ts')
const codemod = require('./codemod')
```

# Todos

- [ ] Convert to a monorepo
- [ ] Add tests
- [ ] Start transforms package
- [ ] Start analyze package
- [ ] Start utils package
- [ ] Add codemod examples
- [ ] Add playground
- [ ] Add site
- [ ] Add share functionality
- [ ] Add design system specific helpers (analyze and change colors, space, etc. between CSS and JS)
- [ ] Load a project (tsconfig.json)
- [ ] Start TS Morph server (this is expensive so we only want to run when we need to)
- [ ] Start optional playground that loads specific sources to test against (simple NextJS app similar to https://astexplorer.net/)
- [ ] Add ability for app to write back to disk or test codemods in memory before transforming codebase
- [ ] If a codemod runs into an error on a file provide a an easy way to skip that file or isolate it to test why a specific file fails
- [ ] Errors can be gathered from running typecheck and eslint if available
- [ ] Analyze a project based on a builtin helper, or a custom helper located in the .tsxmod/analyze .tsxmod/transform directory settings
- [ ] View collapsible AST tree of a file
