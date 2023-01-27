'use client'
import { Node } from 'tsxmod/ts-morph'
import { getChildrenFunction, TreeMode } from 'tsxmod/utils'
import { useEffect, useRef } from 'react'
import { scrollIntoView } from '../utils/scroll'

export function ASTExplorer({
  node,
  activeNode,
  setActiveNode,
  setHoveredNode,
  level = 0,
}: {
  node: Node
  activeNode?: Node
  setActiveNode?: (value: Node) => void
  setHoveredNode?: (value: Node) => void
  level?: number
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const isSelected = activeNode === node
  const isParentSelected = node.getFirstAncestor(
    (ancestor) => ancestor === activeNode
  )
  const getChildren = getChildrenFunction(TreeMode.forEachChild)
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
          setActiveNode?.(node)
        }}
        onMouseEnter={() => {
          setHoveredNode?.(node)
        }}
        onMouseLeave={() => {
          setHoveredNode?.(null)
        }}
      >
        {node.getKindName()}

        {node === activeNode ? (
          <span className="ast-node-text">{node.getText()}</span>
        ) : null}
      </button>

      {children.length > 0 ? (
        <ul>
          {children.map((child) => {
            return (
              <li
                key={child.getPos()}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <ASTExplorer
                  node={child}
                  activeNode={activeNode}
                  setActiveNode={setActiveNode}
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
