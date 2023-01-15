'use client'
import { Dispatch, SetStateAction } from 'react'
import { Node } from 'tsxmod/ts-morph'
import { useEffect, useRef } from 'react'
import { scrollIntoView } from '../utils/scroll'

export function ASTExplorer({
  node,
  activeNodes,
  setActiveNodes,
  setHoveredNode,
  level = 0,
}: {
  node: Node
  activeNodes?: Node[]
  setActiveNodes?: Dispatch<SetStateAction<Node[]>>
  setHoveredNode?: Dispatch<SetStateAction<Node | null>>
  level?: number
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const isSelected = activeNodes?.includes(node) ?? false
  const isParentSelected = activeNodes?.some((activeNode) =>
    node.getFirstAncestor((ancestor) => ancestor === activeNode)
  )
  const children = getChildren(node)

  useEffect(() => {
    if (isSelected) {
      scrollIntoView(ref.current)
    }
  }, [isSelected])

  return (
    <>
      <button
        ref={ref}
        className="ast-node"
        style={{
          paddingLeft: `calc(var(--space-1) * ${level})`,
          backgroundColor: isSelected
            ? '#3178c6'
            : isParentSelected
            ? '#18324e'
            : undefined,
        }}
        onClick={() => {
          setActiveNodes?.([node])
        }}
        onMouseEnter={() => {
          setHoveredNode?.(node)
        }}
        onMouseLeave={() => {
          setHoveredNode?.(null)
        }}
      >
        {node.getKindName()}
      </button>

      {children.length > 0 ? (
        <ul>
          {getChildren(node).map((child) => {
            return (
              <li
                key={child.getPos()}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <ASTExplorer
                  node={child}
                  activeNodes={activeNodes}
                  setActiveNodes={setActiveNodes}
                  setHoveredNode={setHoveredNode}
                  level={level + 1}
                />
              </li>
            )
          })}
        </ul>
      ) : null}
    </>
  )
}

export function getChildren(node: Node) {
  const nodes: Node[] = []

  node.forEachChild((child) => {
    nodes.push(child)
  })

  return nodes
}
