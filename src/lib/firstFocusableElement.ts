export const firstFocusableElement = (
  element: HTMLElement
): HTMLElement | null => {
  return element.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
}

export default firstFocusableElement
