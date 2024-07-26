import { createApiClient, fromURLSearchParams } from './WithApiClient'
import firstFocusableElement from '@/lib/firstFocusableElement'
import defer from 'defer-promise'
import type { ReactiveController, ReactiveControllerHost } from 'lit'

type FetchSectionsArguments = {
  /** List of Section Ids to load from Shopify Rendering API */
  sectionIds: string[]
  /** Base URL to fetch the sections from */
  baseUrl?: string | null
  /** Query params to send with the request */
  params?: Record<string, string | string[]>
  /** If true, it will include the existing query params in the request, default: true */
  includeExistingParams?: boolean
  /** If true, it will use the cache to fetch the sections meaning the same sections with same parmas will not be re-fetched, default: false */
  withCache?: boolean
}

/** Utility to fetch and replace sections in the DOM
 * @param host ReactiveControllerHost
 * @param skipppedParams List of query params to skip when replacing the content
 *
 * @example
 * import { HTMLUpdateUtility } from '@/mixins/HTMLUpdateUtility'
 *
 * export class MyComponent extends BaseElement {
 *  $htmlUpdateUtility: HTMLUpdateUtility = new HTMLUpdateUtility(this, [
 *    'section-name',
 *    'id',
 *   ])
 *  ...}
 */
class HTMLUpdateUtility implements ReactiveController {
  host: ReactiveControllerHost
  abortController!: AbortController | undefined
  lastFocusedElementSelectorId: string | null = null
  $subSectionsCache: Record<string, string> = {}
  skippedParams: string[] = []

  $api = createApiClient({
    baseUrl: ``,
  })

  /** Fetches the sections from Shopify Rendering API */
  async fetchSections({
    sectionIds,
    baseUrl = null,
    params = {},
    includeExistingParams = true,
    withCache = false,
  }: FetchSectionsArguments) {
    if (sectionIds.length === 0) {
      return {}
    }
    this.abortController?.abort('Previous request aborted')
    this.abortController = new AbortController()
    const existingParams = includeExistingParams
      ? fromURLSearchParams(new URLSearchParams(window.location.search))
      : {}
    const request = await this.$api<Record<string, string>>(
      `${baseUrl ?? window.location.pathname}`,
      {
        method: 'GET',
        signal: this.abortController.signal,
      },
      {
        params: {
          ...existingParams,
          ...params,
          sections: sectionIds.join(','),
        },
        withCache,
      }
    )

    return request
  }

  #preProcessCallbacks: Function[] = []
  #postProcessCallbacks: Function[] = []

  /** Adds a callback to be called before the content is replaced */
  addPreProcessCallback(callback: Function) {
    this.#preProcessCallbacks.push(callback)
  }

  /** Adds a callback to be called after the content is replaced */
  addPostProcessCallback(callback: Function) {
    this.#postProcessCallbacks.push(callback)
  }

  constructor(host: ReactiveControllerHost, skipppedParams: string[] = []) {
    ;(this.host = host).addController(this)
    this.skippedParams = skipppedParams
  }

  hostDisconnected() {
    this.abortController?.abort('Host disconnected')
  }

  private _updateAttributes(oldNode: HTMLElement, newNode: Element) {
    Array.from(newNode.attributes).forEach((attribute) => {
      if (attribute.name === 'cloak') return
      // if atttibute is not equal to old node attribute, update it
      if (
        !this.skippedParams.includes(attribute.name) &&
        oldNode.getAttribute(attribute.name) !== attribute.value
      ) {
        oldNode.setAttribute(attribute.name, attribute.value)
      }
    })

    // remove attributes that are not in the new node
    Array.from(oldNode.attributes).forEach((attribute) => {
      if (attribute.name === 'cloak') return
      if (
        !this.skippedParams.includes(attribute.name) &&
        !newNode.hasAttribute(attribute.name)
      ) {
        oldNode.removeAttribute(attribute.name)
      }
    })
  }

  extractSubsectionIds(renderRoot: HTMLElement) {
    const subSectionIds = Array.from(
      renderRoot.querySelectorAll('[sub-section-id]')
    )
      .map((section) => section.getAttribute('sub-section-id') as string)
      .filter(Boolean)

    return subSectionIds
  }

  private selectSubsection(root: HTMLElement, sectionId: string) {
    return root.querySelector(`[sub-section-id="${sectionId}"]`)
  }

  /** Fetches the sections and replaces the content of the renderRoot with the new content
   * @param renderRoot Root element to replace the content with
   * @param forceReplaceAll If true, it will replace all the content of the renderRoot with the new content, skips subsections
   * @param sectionIds List of Section Ids to load from Shopify Rendering API
   * @param baseUrl Base URL to fetch the sections from
   * @param params Query params to send with the request
   * @param includeExistingParams If true, it will include the existing query params in the request, default: true
   * @param withCache If true, it will use the cache to fetch the sections meaning the same sections with same parmas will not be re-fetched, default: false
   *
   * @returns Promise<void>
   */
  async fetchAndReplaceSections({
    renderRoot,
    forceReplaceAll = false, // If true, it will replace all the content of the renderRoot with the new content, skips subsections
    sectionIds,
    baseUrl = null,
    params = {},
    includeExistingParams = true,
    withCache = false,
  }: FetchSectionsArguments & {
    /** Root element to replace the content with */
    renderRoot: HTMLElement
    /** If true, it will replace all the content of the renderRoot with the new content, skips subsections */
    forceReplaceAll?: boolean
  }) {
    const sections = await this.fetchSections({
      sectionIds,
      baseUrl,
      params,
      includeExistingParams,
      withCache,
    })
    for (const sectionId in sections) {
      const sectionHTMLString = sections[sectionId]
      const sectionRoot = renderRoot.querySelector(
        `[section-id="${sectionId}"]`
      )
      if (
        !sectionRoot ||
        !sectionHTMLString ||
        typeof sectionHTMLString !== 'string'
      ) {
        continue
      }

      const newSectionHTML = this.parseSectionStringForSelector(
        sectionHTMLString as string,
        `[section-id="${sectionId}"]`
      )

      newSectionHTML &&
        (await this.replace(
          sectionRoot as HTMLElement,
          newSectionHTML,
          forceReplaceAll
        ))
    }
  }

  // Fetches the section and replaces the content of the renderRoot with the new content for the section ID provided.
  /** Fetches the section and replaces the content of the renderRoot with the new content for the section ID provided.
   * @param renderRoot Root element to replace the content with
   * @param forceReplaceAll If true, it will replace all the content of the renderRoot with the new content, skips subsections
   * @param sectionId Section ID to fetch from Shopify Rendering API
   * @param baseUrl Base URL to fetch the sections from
   * @param params Query params to send with the request
   * @param includeExistingParams If true, it will include the existing query params in the request, default: true
   * @param withCache If true, it will use the cache to fetch the sections meaning the same sections with same parmas will not be re-fetched, default: false
   * @returns Promise<void>
   **/
  async fetchAndReplaceSectionId({
    renderRoot,
    forceReplaceAll = false, // If true, it will replace all the content of the renderRoot with the new content, skips subsections
    sectionId,
    baseUrl = null,
    params = {},
    includeExistingParams = true,
    withCache = false,
  }: Omit<FetchSectionsArguments, 'sectionIds'> & {
    /** Section ID to fetch from Shopify Rendering API */
    sectionId: string
    /** Root element to replace the content with */
    renderRoot: HTMLElement
    /** If true, it will replace all the content of the renderRoot with the new content, skips subsections */
    forceReplaceAll?: boolean
  }) {
    const sections = await this.fetchSections({
      sectionIds: [sectionId],
      baseUrl,
      params,
      includeExistingParams,
      withCache,
    })
    for (const sectionId in sections) {
      const sectionHTMLString = sections[sectionId]
      if (!sectionHTMLString || typeof sectionHTMLString !== 'string') {
        continue
      }

      const sectionHTML = this.parseSectionStringForSelector(
        sectionHTMLString as string,
        `[section-id="${sectionId}"]`
      )

      sectionHTML &&
        (await this.replace(renderRoot, sectionHTML, forceReplaceAll))
    }
  }

  private _recordLastFocusedElement(renderRoot: HTMLElement) {
    try {
      const activeElement = document.activeElement
      if (
        activeElement &&
        activeElement.id &&
        (renderRoot.contains(activeElement) || activeElement === renderRoot)
      ) {
        this.lastFocusedElementSelectorId = activeElement.id
      }
    } catch (error) {
      console.error(error)
    }
  }

  private _restoreFocusToLastElement(renderRoot: HTMLElement) {
    try {
      if (this.lastFocusedElementSelectorId) {
        setTimeout(() => {
          const activeElement = document.querySelector(
            `#${this.lastFocusedElementSelectorId}`
          ) as HTMLElement
          if (activeElement) {
            activeElement?.focus()
          } else {
            ;(firstFocusableElement(renderRoot) || renderRoot)?.focus()
          }

          this.lastFocusedElementSelectorId = null
        }, 50)
      }
    } catch (error) {
      console.error(error)
    }
  }

  /** Replaces the content of the renderRoot with the newContent. If the newContent has subsections, it will replace the subsections in the renderRoot with the subsections in the newContent.
   * @param renderRoot Root element to replace the content with
   * @param newContent New content to replace the renderRoot with
   * @param forceReplaceAll If true, it will replace all the content of the renderRoot with the new content, skips subsections
   * @returns Promise<void>
   * */
  async replace(
    /** Root element to replace the content with */
    renderRoot: HTMLElement,
    /** New content to replace the renderRoot with */
    newContent: Element,
    /** If true, it will replace all the content of the renderRoot with the new content, skips subsections */
    forceReplaceAll: boolean = false
  ) {
    this._recordLastFocusedElement(renderRoot)
    this.#preProcessCallbacks.forEach((callback) => callback(newContent))
    const renderDefer = defer<void>()
    if (!document.startViewTransition) {
      setTimeout(async () => {
        await this._runReplace(renderRoot, newContent, forceReplaceAll)
        renderDefer.resolve()
      }, 0)
    } else {
      document.startViewTransition(async () => {
        await this._runReplace(renderRoot, newContent, forceReplaceAll)
        renderDefer.resolve()
      })
    }
    await renderDefer.promise
    this.#postProcessCallbacks.forEach((callback) => callback(newContent))
    this._restoreFocusToLastElement(renderRoot)
  }

  async _runReplace(
    renderRoot: HTMLElement,
    newContent: Element,
    forceReplaceAll: boolean = false
  ) {
    // Extract subsections from the new content
    const subSectionIds = forceReplaceAll
      ? []
      : this.extractSubsectionIds(newContent as HTMLElement)
    if (subSectionIds.length > 0) {
      for (const sectionId of subSectionIds) {
        const section = this.selectSubsection(
          newContent as HTMLElement,
          sectionId
        )
        const targetRoot = this.selectSubsection(renderRoot, sectionId)

        if (section && targetRoot) {
          // If the subsection is not in the cache or the content has changed, replace the subsection
          // with the new content
          !this._checkSubSectionsCache(sectionId, section.innerHTML) &&
            (await this.setInnerHTML(targetRoot as HTMLElement, section))
          this._setSubSectionsCache(sectionId, section.innerHTML)
        }
      }
    } else {
      await this.setInnerHTML(renderRoot, newContent)
    }
  }

  // Sets the subsection content in the cache
  private _setSubSectionsCache(sectionId: string, newContent: string) {
    this.$subSectionsCache[sectionId] = newContent
  }

  // Checks if the subsection content is in the cache and if it is the same as the new content
  private _checkSubSectionsCache(sectionId: string, newContent: string) {
    if (this.$subSectionsCache[sectionId] === newContent) {
      return true
    }
    this.$subSectionsCache[sectionId] = newContent
    return false
  }

  parseSectionStringForSelector(sectionString: string, selectior: string) {
    return new DOMParser()
      .parseFromString(sectionString, 'text/html')
      .querySelector(selectior)
  }

  _render(renderRoot: HTMLElement, newContent: Element) {
    this._setInnerHTML(renderRoot, newContent.innerHTML)
    this._updateAttributes(renderRoot, newContent)
  }

  /** Replaces the content of the renderRoot with the newContent. If the newContent has subsections, it will replace the subsections in the renderRoot with the subsections in the newContent.
   * @param renderRoot Root element to replace the content with
   * @param newContent New content to replace the renderRoot with
   * @returns Promise<void>
   * */
  setInnerHTML(renderRoot: HTMLElement, newContent: Element) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this._render(renderRoot, newContent)
        resolve(renderRoot)
      }, 0)
    })
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  private _setInnerHTML(root: HTMLElement, html: string) {
    root.innerHTML = html
    root
      .querySelectorAll('script')
      .forEach((oldScriptTag: HTMLScriptElement) => {
        const newScriptTag = document.createElement('script')
        Array.from(oldScriptTag.attributes).forEach((attribute) => {
          newScriptTag.setAttribute(attribute.name, attribute.value)
        })
        newScriptTag.appendChild(
          document.createTextNode(oldScriptTag.innerHTML)
        )
        oldScriptTag.parentNode?.replaceChild(newScriptTag, oldScriptTag)
      })
  }
}

export default HTMLUpdateUtility
