import { type DeferredMedia } from './core-deferred-media'
import type { ModalDialog } from './core-dialog'
import ariaLiveRegionContext, {
  ARIA_LIVE_REGION_EVENTS,
} from '@/contexts/aria-live-region-context'
import cartContext from '@/contexts/cart-context'
import cartSectionsContext, {
  type CartSections,
} from '@/contexts/cart-sections'
import deferredMediaContext, {
  type DeferredMediaContext,
} from '@/contexts/deferred-media'
import modalContext, { type ModalContext } from '@/contexts/modal-context'
import quickShopContext, { type QuickShopContext } from '@/contexts/quickshop'
import type { AriaLiveRegionContext } from '@/custom_typings/app'
import type { ShopifyCart } from '@/custom_typings/shopify'
import { provide } from '@lit/context'
import { LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'

const DIALOG_EVENTS = {
  OPEN: 'modal-dialog::open',
  CLOSE: 'modal-dialog::close',
  CLOSE_ALL: 'modal-dialog::close-all',
}

const CART_EVENTS = {
  UPDATED: 'cart:updated',
  UPDATED_SECTIONS: 'cart:updated-sections',
}

const DEFERRED_MEDIA_EVENTS = {
  PAUSE: 'deferred-media::pause',
  PLAY: 'deferred-media::play',
}

const QUICKSHOP_EVENTS = {
  OPEN: 'quickshop::open',
  CLOSE: 'quickshop::close',
}

const MODAL_PARAM_KEY = 'modals'
@customElement('app-provider')
export class AppProvider extends LitElement {
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  @provide({ context: cartContext })
  @state()
  cart: ShopifyCart = window.__CART__

  @provide({ context: cartSectionsContext })
  @state()
  cartSections: CartSections = {}

  @provide({ context: modalContext })
  @state()
  modals: ModalContext = []

  @provide({ context: ariaLiveRegionContext })
  @state()
  ariaLiveRegion!: AriaLiveRegionContext

  @provide({ context: deferredMediaContext })
  @state()
  activeDeferredMedia: DeferredMediaContext = null

  @provide({ context: quickShopContext })
  @state()
  quickShop: QuickShopContext = null

  connectedCallback(): void {
    this.addEventListener(
      CART_EVENTS.UPDATED,
      this._handleCartUpdate.bind(this) as EventListener
    )

    this.addEventListener(
      CART_EVENTS.UPDATED_SECTIONS,
      this._handleCartSectionsUpdate.bind(this) as EventListener
    )

    this.addEventListener(
      ARIA_LIVE_REGION_EVENTS.SET,
      this._handleAriaLiveRegionSet.bind(this) as EventListener
    )

    this.addEventListener(
      ARIA_LIVE_REGION_EVENTS.CLEAR,
      this._handleAriaLiveRegionClear.bind(this) as EventListener
    )

    this.addEventListener(
      DEFERRED_MEDIA_EVENTS.PAUSE,
      this._handleDeferredMediaPause.bind(this) as EventListener
    )

    this.addEventListener(
      DEFERRED_MEDIA_EVENTS.PLAY,
      this._handleDeferredMediaPlay.bind(this) as EventListener
    )

    /*
     * Custom schema watcher for modal-dialog:// links and open the relevant dialog
     */
    this.addEventListener(
      'click',
      this._handleDialogSchemaClick.bind(this) as EventListener
    )

    Object.values(DIALOG_EVENTS).forEach((event) => {
      this.addEventListener(
        event,
        this._handleDialogEvent.bind(this) as EventListener
      )
    })

    Object.values(QUICKSHOP_EVENTS).forEach((event) => {
      this.addEventListener(
        event,
        this._handleQuickShopEvent.bind(this) as EventListener
      )
    })

    this._handleRestoreModals()
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener(
      CART_EVENTS.UPDATED,
      this._handleCartUpdate.bind(this) as EventListener
    )

    this.removeEventListener(
      CART_EVENTS.UPDATED_SECTIONS,
      this._handleCartSectionsUpdate.bind(this) as EventListener
    )

    this.removeEventListener(
      ARIA_LIVE_REGION_EVENTS.SET,
      this._handleAriaLiveRegionSet.bind(this) as EventListener
    )

    this.removeEventListener(
      ARIA_LIVE_REGION_EVENTS.CLEAR,
      this._handleAriaLiveRegionClear.bind(this) as EventListener
    )

    this.removeEventListener(
      DEFERRED_MEDIA_EVENTS.PAUSE,
      this._handleDeferredMediaPause.bind(this) as EventListener
    )

    this.removeEventListener(
      DEFERRED_MEDIA_EVENTS.PLAY,
      this._handleDeferredMediaPlay.bind(this) as EventListener
    )

    this.removeEventListener(
      'click',
      this._handleDialogSchemaClick.bind(this) as EventListener
    )

    Object.values(DIALOG_EVENTS).forEach((event) => {
      this.removeEventListener(
        event,
        this._handleDialogEvent.bind(this) as EventListener
      )
    })

    Object.values(QUICKSHOP_EVENTS).forEach((event) => {
      this.removeEventListener(
        event,
        this._handleQuickShopEvent.bind(this) as EventListener
      )
    })
  }

  _handleDeferredMediaPlay(event: CustomEvent<void>): void {
    const composedPath = event.composedPath()
    const target = (
      composedPath.length > 0 ? composedPath[0] : event.target
    ) as HTMLElement

    if (
      target === this.activeDeferredMedia ||
      target.tagName !== 'DEFERRED-MEDIA'
    ) {
      return
    }
    this.activeDeferredMedia = target as DeferredMedia
  }

  public _handleDeferredMediaPause(): void {
    this._pauseAllDeferredMedia()
  }

  private _handleCartUpdate(event: CustomEvent<ShopifyCart>): void {
    if (event.detail) {
      this.cart = event.detail
    }
  }

  private _handleCartSectionsUpdate(event: CustomEvent<CartSections>): void {
    if (event.detail) {
      this.cartSections = event.detail || {}
    }
  }

  _handleDialogSchemaClick(event: MouseEvent): void {
    const composedPath = event.composedPath()
    const target = (
      composedPath.length > 0 ? composedPath[0] : event.target
    ) as HTMLElement

    if (target.tagName === 'A') {
      const href = target.getAttribute('href')

      // Check if the href starts with the custom scheme
      // it can start with modal-dialog:// or #modal-dialog://
      if (
        href &&
        (href.startsWith('modal-dialog://') ||
          href.startsWith('#modal-dialog://'))
      ) {
        event.preventDefault() // Prevent the default navigation
        // Extract the dialog ID
        const dialogId = href.replace('modal-dialog://', '').replace('#', '')
        // Execute the custom function
        !!dialogId &&
          this._handleDialogEvent(
            new CustomEvent(DIALOG_EVENTS.OPEN, { detail: dialogId })
          )
      }
    }
  }

  private _handleDialogEvent(event: CustomEvent<string | undefined>): void {
    let modals = [...this.modals]
    switch (event.type) {
      case DIALOG_EVENTS.OPEN:
        if (event.detail) {
          modals = [...modals, event.detail]
        }
        break

      case DIALOG_EVENTS.CLOSE:
        if (event.detail) {
          modals = modals.filter((modal) => modal !== event.detail)
        }
        this.quickShop = null
        break

      case DIALOG_EVENTS.CLOSE_ALL:
        modals = []
        this.quickShop = null
        break
    }

    modals = [...new Set(modals)]
    this.modals = modals
    this._applyModalsState()
    this._pauseAllDeferredMedia()
    this._updateQueryParams()
  }

  _pauseAllDeferredMedia(): void {
    try {
      if (this.activeDeferredMedia === null) {
        const allDeferredMedia = Array.from(
          this.querySelectorAll('deferred-media')
        ) as DeferredMedia[]
        allDeferredMedia.forEach((media) => media.pause(true))
        return
      }
      this.activeDeferredMedia = null
    } catch (error) {
      console.error(error)
    }
  }

  private async _applyModalsState() {
    await customElements.whenDefined('modal-dialog')
    const modals = this.modals
    const allModalDialogs: ModalDialog[] = Array.from(
      this.querySelectorAll('modal-dialog')
    )

    for (const dialog of allModalDialogs) {
      if (modals.includes(dialog.id)) {
        dialog.show()
      } else {
        dialog.hide()
      }
    }
  }

  private _handleRestoreModals() {
    const params = new URLSearchParams(window.location.search)
    const modals = params.get(MODAL_PARAM_KEY)
    if (modals) {
      this.modals = modals
        .split(',')
        .map((modal) => modal.trim())
        .filter(Boolean)
      this._applyModalsState()
    }
  }

  private _updateQueryParams() {
    const params = new URLSearchParams(window.location.search)
    const modals = this.modals
    const modalIds = this.modals.join(',')

    if (modals.length > 0) {
      params.set(MODAL_PARAM_KEY, modalIds)
    } else {
      params.delete(MODAL_PARAM_KEY)
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }

  private _handleAriaLiveRegionSet(event: CustomEvent<AriaLiveRegionContext>) {
    if (event.detail) {
      this.ariaLiveRegion = event.detail
    }
  }

  private _handleAriaLiveRegionClear() {
    this.ariaLiveRegion = {
      message: '',
    }
  }

  private _handleQuickShopEvent(event: CustomEvent<string | void>) {
    const type = event.type
    const detail = event.detail
    if (type === QUICKSHOP_EVENTS.OPEN) {
      this.quickShop = detail as string
    } else {
      this.quickShop = null
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-provider': AppProvider
  }
}
