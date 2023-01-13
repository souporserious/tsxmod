import { Node, SourceFile } from 'ts-morph'

/** Get all nodes between a start and end offset. */
export function getNodesBetweenOffsets(
  sourceFile: SourceFile,
  start: number,
  end: number
) {
  const nodes: Node[] = []
  let position = start

  while (position < end) {
    const node = sourceFile.getDescendantAtPos(position)

    if (node) {
      nodes.push(node)

      position = node.getEnd()
    } else {
      position++
    }
  }

  return nodes
}
