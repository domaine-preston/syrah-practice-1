import { ReactiveController, ReactiveControllerHost } from 'lit'

/**
 * A utility class to handle media queries in a reactive way.
 * This class is a ReactiveController.
 *
 * @param host - The host element that will use this utility.
 * @param mediaQuerySelector - The media query selector to be used. eg. '(min-width: 600px)'
 *
 * @example
 *  import { LitElement } from 'lit'
 *  import { customElement } from 'lit/decorators.js'
 *  import { MediaQueryUtility } from './MediaQueryUtility'
 *
 *  export class MyElement extends LitElement {
 *   mediaQueryUtility = new MediaQueryUtility(this, '(min-width: 600px)')
 *  }
 */
export class MediaQueryUtility implements ReactiveController {
  host: ReactiveControllerHost
  mediaQuery: MediaQueryList
  #onChangeCallacks: Array<() => void> = []

  constructor(host: ReactiveControllerHost, mediaQuerySelector: string) {
    ;(this.host = host).addController(this)
    this.mediaQuery = window.matchMedia(mediaQuerySelector)
    this.onMediaQueryChange = this.onMediaQueryChange.bind(this)
  }

  addOnChangeCallback(callback: () => void) {
    this.#onChangeCallacks.push(callback)
  }

  hostConnected(): void {
    this.mediaQuery.addEventListener('change', this.onMediaQueryChange)
  }

  hostDisconnected() {
    this.mediaQuery.removeEventListener('change', this.onMediaQueryChange)
    this.#onChangeCallacks = []
  }

  get active() {
    return this.mediaQuery.matches
  }

  async onMediaQueryChange() {
    await this.host.updateComplete
    this.host.requestUpdate()
    this.#onChangeCallacks.forEach((callback) => callback())
  }
}
