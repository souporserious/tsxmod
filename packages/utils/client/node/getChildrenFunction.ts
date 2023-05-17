import { Node } from 'ts-morph'

export const TreeMode = {
  getChildren: 'getChildren',
  forEachChild: 'forEachChild',
} as const

/**
 * Get the children of a node using `getChildren` or `forEachChild`.
 *
 * @citation
 * Forked from [ts-ast-viewer](https://github.com/dsherret/ts-ast-viewer/blob/main/site/src/compiler/getChildrenFunction.ts)
 */
export function getChildrenFunction(
  mode: keyof typeof TreeMode
): (node: Node) => Node[] {
  switch (mode) {
    case TreeMode.getChildren:
      return getAllChildren
    case TreeMode.forEachChild:
      return forEachChild
    default:
      throw new Error(`Unknown tree mode: ${mode}`)
  }

  function getAllChildren(node: Node) {
    return node.getChildren()
  }

  function forEachChild(node: Node) {
    const nodes: Node[] = []

    node.forEachChild((child) => {
      nodes.push(child)
      return undefined
    })

    return nodes
  }
}
