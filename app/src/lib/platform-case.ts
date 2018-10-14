/** Convert input string to current platform's text case preference. */
export function toPlatformCase(inputText: string): string {
  inputText = inputText
    .toLowerCase()
    .replace(/\b[a-z]/gi, $1 => $1.toUpperCase())

  return inputText
}
