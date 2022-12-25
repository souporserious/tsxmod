let swc = null

export async function transformCode(codeString: string) {
  if (swc === null) {
    const module = await import('@swc/wasm-web')
    await module.default()
    swc = module
  }
  return swc.transformSync(codeString, {
    filename: 'index.tsx',
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
      },
    },
    module: {
      type: 'commonjs',
    },
  }).code
}

export async function executeCode(
  codeString: string,
  dependencies: Record<string, unknown> = {}
) {
  const transformedCode = await transformCode(codeString)
  const exports: Record<string, unknown> = {}
  const require = (path) => {
    if (dependencies[path]) {
      return dependencies[path]
    }
    throw Error(`Module not found: ${path}.`)
  }
  const result = new Function('exports', 'require', transformedCode)

  result(exports, require)

  return exports.default as (...args: unknown[]) => unknown
}
