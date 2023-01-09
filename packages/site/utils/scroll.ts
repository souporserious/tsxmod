/** Get the closest element that scrolls */
function getClosestViewport(
  /** The element to start searching from. */
  node: HTMLElement,
  /** Include overflow: hidden when searching for a viewport. */
  includeHidden?: boolean
) {
  if (node) {
    const { overflow, overflowX, overflowY } = getComputedStyle(node)
    const canScroll = (
      includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/
    ).test(overflow + overflowX + overflowY)

    if (node === document.body || canScroll) {
      return node
    } else {
      return getClosestViewport(node.parentElement, includeHidden)
    }
  } else {
    return document.body
  }
}

/** Create a common interface for interacting with scrollable elements. */
function scroller(node) {
  if (node === document.body) {
    return {
      offsetTop: 0,
      scrollY: window.pageYOffset,
      height: window.innerHeight,
      setPosition: (top) => window.scrollTo(0, top),
    }
  } else {
    return {
      offsetTop: node.getBoundingClientRect().top,
      scrollY: node.scrollTop,
      height: node.offsetHeight,
      setPosition: (top) => (node.scrollTop = top),
    }
  }
}

/** Scroll an element into view. */
export function scrollIntoView(node) {
  const scrollParent = scroller(getClosestViewport(node, true))

  if (scrollParent === null) {
    return
  }

  const nodeRect = node.getBoundingClientRect()
  const nodeTop = scrollParent.scrollY + (nodeRect.top - scrollParent.offsetTop)

  if (nodeTop < scrollParent.scrollY) {
    // the item is above the scrollable area
    scrollParent.setPosition(nodeTop)
  } else if (
    nodeTop + nodeRect.height >
    scrollParent.scrollY + scrollParent.height
  ) {
    // the item is below the scrollable area
    scrollParent.setPosition(nodeTop + nodeRect.height - scrollParent.height)
  }
}
