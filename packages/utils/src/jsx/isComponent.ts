import test from 'node:test'
import assert from 'node:assert'

/** Determines a JSX component by checking if the name is uppercase. */
export function isComponent(name: string) {
  return /[A-Z]/.test(name.charAt(0))
}

test('string is a component', () => {
  assert(isComponent('Foo') === true)
  assert(isComponent('foo') === false)
})
