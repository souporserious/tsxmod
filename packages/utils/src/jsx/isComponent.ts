/** Determines a JSX component by checking if the name is uppercase. */
export function isComponent(name: string) {
  return /[A-Z]/.test(name.charAt(0))
}
