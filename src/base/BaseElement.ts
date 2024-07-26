import { LitElement, html } from 'lit'

// Cache global stylesheets
let globalSheets: CSSStyleSheet[] = []
const IGNORED_DOMAINES = ['fonts.googleapis.com']
const INCLUDE_ONLY_IDS: string[] = []

const filterToIncludeOnlyIds = (
  styleSheets: CSSStyleSheet[],
  ids: string[]
) => {
  if (ids.length === 0) return styleSheets
  return styleSheets.filter((x) => {
    if (x.ownerNode && x.ownerNode instanceof Element) {
      const elementId = x.ownerNode.id
      return ids.some((id) => elementId === id)
    }

    return true
  })
}

export function getGlobalStyleSheets() {
  if (globalSheets.length === 0) {
    globalSheets = filterToIncludeOnlyIds(
      Array.from(document.styleSheets),
      INCLUDE_ONLY_IDS
    )
      .map((x) => {
        if (x.href && IGNORED_DOMAINES.some((d) => x.href?.includes(d))) {
          return
        }

        const sheet = new CSSStyleSheet()
        try {
          const css = Array.from(x.cssRules)
            .map((rule) => rule.cssText)
            .join(' ')
          sheet.replaceSync(css)
          return sheet
        } catch (e) {
          console.warn('Failed to parse CSS rules from stylesheet', x)
          console.warn(e)
        }

        return
      })
      .filter(Boolean) as CSSStyleSheet[]
  }

  return globalSheets
}

export abstract class BaseElement extends LitElement {
  private _hasAdoptedGlobalStyleSheets = false

  constructor() {
    super()
    this.removeAttribute('cloak')
  }

  connectedCallback(): void {
    super.connectedCallback()
    if (this.shadowRoot && !this._hasAdoptedGlobalStyleSheets) {
      const styleSheets = getGlobalStyleSheets()
      this.shadowRoot.adoptedStyleSheets = [
        ...styleSheets,
        ...(this.shadowRoot.adoptedStyleSheets ?? []),
      ]

      this._hasAdoptedGlobalStyleSheets = true
    }
  }

  $emit(name: string, detail?: unknown) {
    return this.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        composed: true,
        detail,
      })
    )
  }

  $listen(name: string, callback: (event: CustomEvent) => void) {
    this.shadowRoot?.addEventListener(
      name,
      callback.bind(this) as EventListener
    )
  }

  $hide() {
    this.style.display = 'none'
  }

  $show() {
    this.style.display = ''
  }

  render() {
    return html`<slot></slot>`
  }
}

export abstract class BaseElementWithoutShadowDOM extends BaseElement {
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }
}

export default BaseElement
