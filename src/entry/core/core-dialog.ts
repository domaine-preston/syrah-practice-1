import BaseElement from '@/base/BaseElement'
import '@/components/dialog-toggle'
import { WithApiClientMixin } from '@/mixins/WithApiClient'
import { WithModalDialog } from '@/mixins/WithModalDialog'
// @ts-ignore
import styles from '@/styles/component-dialog.css?inline'
import { Task, initialState } from '@lit/task'
import { html, nothing, unsafeCSS } from 'lit'
import {
  customElement,
  property,
  queryAll,
  queryAsync,
} from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

// Usage How to
// <modal-dialog close-on-backdrop-click='true' id='modal'>
// <h1>some title here</h1>
// <hh-button openmodal='drawer'>drawer</hh-button>
// </modal-dialog>
// <modal-dialog close-on-backdrop-click='true' type='drawer' id='drawer' anchor='left'>
// <h1>some title here</h1>
// </modal-dialog>

// <hh-button openmodal='modal'>toggle</hh-button>
// <hh-button openmodal='drawer'>drawer</hh-button>
// <hh-button openmodal='my-example-modal' modaldata='{"hello": "world"}'>With data</hh-button>
// <modal-toggle modalid='drawer'>
// <a class='h4 uppercase link'>I am a simple link for modal</a>
// </modal-toggle>
type MODAL_SIZE = 'modal-max'
@customElement('modal-dialog')
export class ModalDialog extends WithApiClientMixin(
  WithModalDialog(BaseElement)
) {
  static styles = [unsafeCSS(styles)]

  @property({ type: Boolean, reflect: true })
  open!: boolean

  @property({ type: String })
  type = 'modal'

  @property({ type: String, reflect: true })
  size!: MODAL_SIZE

  @property({ type: String })
  anchor = 'right'

  @property({ type: Boolean, reflect: true, attribute: 'without-title' })
  withoutTitle = false

  @property({ type: Boolean, attribute: 'close-on-backdrop-click' })
  closeOnBackdropClick = false

  @property({ type: String, attribute: 'header-classes' })
  headerClasses = ''

  @property({ type: String, attribute: 'close-icon-size' })
  closeIconSize = '24'

  @property({ type: String, attribute: 'url' })
  url!: string

  @queryAsync('dialog')
  dialog!: Promise<HTMLDialogElement>

  @queryAll('iframe, video')
  iframeOrVideo!: NodeListOf<HTMLIFrameElement | HTMLVideoElement>

  #triggerElement: HTMLElement | null = null

  private _loadURLContentTask = new Task(this, {
    task: async ([url], { signal }) => {
      if (!this.hasToLoadURL) {
        return initialState
      }
      const response = await this.$api.client.fetchClient<string>(url, {
        method: 'GET',
        signal,
        headers: {
          'Content-Type': 'text/html',
        },
      })
      signal.throwIfAborted()
      return response
    },
    args: () => [this.url],
  })

  _handleBackdropClick(event: PointerEvent) {
    if (!this.closeOnBackdropClick) {
      return
    }

    if (
      event.target instanceof HTMLElement &&
      event.target.tagName === 'DIALOG'
    ) {
      this.#handleClose()
    }
  }

  _handleGenericClick(event: PointerEvent) {
    const target = event.target as HTMLElement
    if (target.hasAttribute('close-modal')) {
      event.preventDefault()
      this.#handleClose()
    }

    if (target.closest('[close-modal]')) {
      event.preventDefault()
      this.#handleClose()
    }
  }

  _focusOnFirstElement() {
    try {
      setTimeout(async () => {
        const dialog = await this.dialog
        if (dialog) {
          const firstFocusableElement = dialog.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )

          if (firstFocusableElement) {
            ;(firstFocusableElement as HTMLElement).focus()
          }
        }
      }, 300)
    } catch (error) {
      console.error('Error in _focusOnFirstElement', error)
    }
  }

  async show() {
    const dialog = await this.dialog
    if (dialog && !dialog.open) {
      this.#triggerElement = document.activeElement as HTMLElement
      dialog.showModal()
      this._focusOnFirstElement()
      this.open = true
    }
  }

  #handleClose() {
    this.closeModal()
  }

  async hide() {
    const dialog = await this.dialog

    if (dialog && dialog.open) {
      dialog.close()
      this.open = false
    }

    if (this.#triggerElement) {
      this.#triggerElement.focus()
    }
  }

  get hasToLoadURL() {
    const url = this.url
    return !(
      !url ||
      url === '#' ||
      url === 'about:blank' ||
      url === 'javascript:;' ||
      url === 'javascript:void(0)' ||
      url === ''
    )
  }

  get dialogContentHTML() {
    if (!this.hasToLoadURL) {
      return html`<slot @click=${this._handleGenericClick}></slot>`
    }

    return html`
      ${this._loadURLContentTask.render({
        pending: () =>
          html`<p class="caption animate-pulse p-md text-center">
            Loading...
          </p>`,
        complete: (data) => (data ? html`${unsafeHTML(data)}` : nothing),
      })}
    `
  }

  render() {
    return html`
      <dialog
        role="dialog"
        aria-modal="true"
        type="${this.type}"
        aria-labelledby="${this.id}-dialogTitle"
        @modal-close=${this.#handleClose}
        @close=${this.#handleClose}
        .inert=${!this.modalIsOpen}
        class="dialog"
        @click=${this._handleBackdropClick}
      >
        <div
          class="${this.type ||
          'modal'} grid grid-cols-1 grid-rows-[var(--dmn-dialog-header-height,_60px)_minmax(0,_1fr)_auto]"
          size=${this.size}
          anchor=${this.anchor}
        >
          <div
            class="${this
              .headerClasses} sticky top-0 z-50 flex items-center justify-between bg-p-lightest px-sm py-xs"
          >
            <div
              class="${this.withoutTitle ? 'sr-only' : ''} flex-grow"
              id="${this.id}-dialogTitle"
            >
              <slot name="header"></slot>
            </div>

            <button
              @click=${this.#handleClose}
              class="ml-auto inline-flex leading-none focus:outline"
            >
              <slot name="close-icon">
                <svg-icon
                  src="icon-close"
                  style="font-size: ${this.closeIconSize}px"
                ></svg-icon>
                <span class="sr-only">Close</span>
              </slot>
            </button>
          </div>
          <div>${this.dialogContentHTML}</div>
        </div>
      </dialog>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'modal-dialog': ModalDialog
  }
}
