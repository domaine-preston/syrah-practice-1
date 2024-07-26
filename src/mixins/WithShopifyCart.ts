import { type apiClientFetch, createApiClient } from './WithApiClient'
import type BaseElement from '@/base/BaseElement'
import cartContext from '@/contexts/cart-context'
import cartSectionsContext, {
  type CartSections,
} from '@/contexts/cart-sections'
import type {
  AddToShopifyCartResponse,
  CartItemPayload,
  ShopifyCart,
  ShopifyCartError,
  UpdateCartPayload,
} from '@/custom_typings/shopify'
import { consume } from '@lit/context'
// @ts-ignore
import defer from 'defer-promise'
import { state } from 'lit/decorators.js'

export declare class WithApiClientInterface {
  client: apiClientFetch
  /**
   * Adds items to the Shopify cart.
   * @param items - An array of `CartItemPayload` objects representing the items to be added.
   * @returns A promise that resolves to the `AddToShopifyCartResponse` object.
   * @throws If an error occurs during the request.
   **/
  addItemToCart: (items: CartItemPayload[]) => Promise<AddToShopifyCartResponse>

  /**
   * Adds items to the Shopify cart using a form data object.
   * @param formData - The form data object containing the items to be added.
   * @returns A promise that resolves to the `AddToShopifyCartResponse` object.
   * @throws If an error occurs during the request.
   */
  addItemToWithForm: (formData: FormData) => Promise<AddToShopifyCartResponse>

  /**
   * Updates the quantity of items in the cart.
   * @param updates - An object or an array of numbers representing the updated quantities.
   */
  updateQuantityToCart: (updates: UpdateCartPayload | number[]) => Promise<void>

  /**
   * Updates the Shopify cart with the provided data.
   * @param update - The update object containing the data to be updated.
   * @param update.note - Optional. A string representing the note to be added to the cart.
   * @param update.attributes - Optional. An object containing additional attributes to be updated in the cart.
   */
  updateCartNoteAndAttributes: (
    update: {
      note?: string
      attributes?: Record<string, string | number | boolean>
    },
    updateSettings: SectionCartUpdateSettings
  ) => Promise<void>

  /**
   * Removes items from the cart.
   * @param updates - An array of strings or numbers representing the items to be removed. Values can be either the Variant ID or the Line Item Key.
   */
  removeItemFromCart: (updates: string[] | number[]) => Promise<void>

  /**
   * Changes the specified item in the cart.
   * @param item - The payload containing the item details to be changed.
   */
  changeItemToCart: (item: CartItemPayload) => Promise<void>

  /**
   * Clears the cart by sending a request to 'clear.js' and processing the callbacks.
   */
  clearCart: () => Promise<void>

  /**
   * Retrieves the Shopify cart.
   * @returns A promise that resolves to the ShopifyCart object.
   */
  getCart: () => Promise<ShopifyCart>

  /**
   * Retrieves sections registered via the `cart-sections` context.
   * @returns A promise that resolves to the CartSections object.
   * @throws If an error occurs during the request.
   **/
  getCartSections: () => Promise<CartSections>

  /**
   * Retrieves the cart lines for a specific variant ID.
   * @param variantId - The ID of the variant to filter the cart lines.
   * @returns An array of cart items that match the specified variant ID.
   */
  getCartLinesForVariant: (variantId: number) => ShopifyCart['items']

  /**
   * Opens the cart drawer.
   */
  openCartDrawer: () => void

  /**
   * The loading state of the Shopify cart.
   */
  shopifyCartLoading: boolean

  /**
   * The error object returned by the Shopify cart.
   */
  cart: ShopifyCart

  /**
   * The error object returned by the Shopify cart.
   */
  cartSections: CartSections

  /**
   * The sections to fetch from the Shopify cart.
   */
  sectionsToFetch: string

  /**
   * The Shopify cart error object.
   */
  shopifyCartError?: ShopifyCartError | null
}

export const CART_SECTIONS_IDS: Set<string> = new Set([])
export const CART_DRAWER_DIALOG_ID = 'cart-drawer-dialog'

export type SectionCartUpdateSettings = {
  cart?: boolean
  sections?: boolean
}

const DEFAULT_SECTION_CART_UPDATE_SETTINGS: SectionCartUpdateSettings = {
  cart: true,
  sections: true,
}

export const WithShopifyCartClientMixin = <
  T extends AbstractConstructor<BaseElement>,
>(
  superClass: T
) => {
  abstract class WithShopifyCartClientClass extends superClass {
    connectedCallback(): void {
      super.connectedCallback()
      const sectionId = this.getAttribute('section-id')
      if (!!sectionId && typeof sectionId === 'string') {
        CART_SECTIONS_IDS.add(sectionId)
      }
    }

    @consume({ context: cartContext, subscribe: true })
    cart!: ShopifyCart

    @consume({ context: cartSectionsContext, subscribe: true })
    cartSections!: CartSections

    @state()
    shopifyCartLoading = false

    @state()
    shopifyCartError: ShopifyCartError | null = null

    private loadingCartPromise: DeferPromise.Deferred<ShopifyCart> | null = null

    client = createApiClient({
      baseUrl: `${window.Shopify.routes.root}cart`,
      headers: {
        'Content-Type': 'application/json',
      },
      defaultMethod: 'POST',
      withQueue: true,
      queueKey: 'shopify-cart',
      onRequestStart: () => {
        this.shopifyCartLoading = true
        this.classList.add('loading')
        Array.from(this.querySelectorAll('button')).forEach((button) => {
          button.classList.add('disabled')
        })
      },
      onRequestEnd: () => {
        this.shopifyCartLoading = false
        this.classList.remove('loading')
        Array.from(this.querySelectorAll('button')).forEach((button) => {
          button.classList.remove('disabled')
        })
      },
    })

    get sectionsToFetch() {
      // limit to 5 sections
      return Array.from(CART_SECTIONS_IDS).slice(0, 5).join(',')
    }

    async addItemToCart(items: CartItemPayload[]) {
      try {
        const deltaItems = await this.client<AddToShopifyCartResponse>(
          '/add.js',
          {
            body: {
              items,
              sections: this.sectionsToFetch,
              sections_url: window.location.pathname,
            },
          }
        )
        await this._handleCartChange()
        deltaItems.sections &&
          this._handleCartSectionsChange(deltaItems.sections)
        return deltaItems
      } catch (error) {
        this._handleCartError(error as ShopifyCartError)
        throw error
      }
    }

    async addItemToWithForm(formData: FormData) {
      try {
        formData.append('sections', this.sectionsToFetch)
        formData.append('sections_url', window.location.pathname)

        const deltaItems = await this.client<AddToShopifyCartResponse>(
          '/add',
          {
            body: formData,
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              Accept: `application/json`,
            },
          },
          {
            rawBody: true,
            removeContentType: true,
          }
        )
        await this._handleCartChange()
        deltaItems.sections &&
          this._handleCartSectionsChange(deltaItems.sections)
        return deltaItems
      } catch (error) {
        this._handleCartError(error as ShopifyCartError)
        throw error
      }
    }

    async updateQuantityToCart(updates: UpdateCartPayload | number[]) {
      try {
        const cart = await this.client<ShopifyCart>('/update.js', {
          body: {
            updates,
            sections: this.sectionsToFetch,
            sections_url: window.location.pathname,
          },
        })
        await this._handleCartChange(cart)
        cart.sections && this._handleCartSectionsChange(cart.sections)
      } catch (error) {
        this._handleCartError(error as ShopifyCartError)
        throw error
      }
    }

    async updateCartNoteAndAttributes(
      update: {
        note?: string
        attributes?: Record<string, string | number | boolean>
      },
      updateSettings: SectionCartUpdateSettings = DEFAULT_SECTION_CART_UPDATE_SETTINGS
    ) {
      const cart = await this.client<ShopifyCart>('/update.js', {
        body: {
          ...update,
          sections: this.sectionsToFetch,
          sections_url: window.location.pathname,
        },
      })
      await this._handleCartChange(cart)
      updateSettings.sections &&
        cart.sections &&
        this._handleCartSectionsChange(cart.sections)
    }

    async removeItemFromCart(updates: string[] | number[]) {
      const cart = await this.client<ShopifyCart>('/update.js', {
        body: {
          updates: updates.reduce(
            (acc, id) => {
              acc[id] = 0
              return acc
            },
            {} as Record<string | number, number>
          ),
          sections: this.sectionsToFetch,
          sections_url: window.location.pathname,
        },
      })
      await this._handleCartChange(cart)
      cart.sections && this._handleCartSectionsChange(cart.sections)
    }

    async changeItemToCart(item: CartItemPayload) {
      const cart = await this.client<ShopifyCart>('/change.js', {
        body: {
          ...item,
          sections: this.sectionsToFetch,
          sections_url: window.location.pathname,
        },
      })
      await this._handleCartChange()
      cart.sections && this._handleCartSectionsChange(cart.sections)
    }

    async clearCart() {
      const cart = await this.client<ShopifyCart>('/clear.js', {
        body: {
          sections: this.sectionsToFetch,
          sections_url: window.location.pathname,
        },
      })
      await this._handleCartChange(cart)
      cart.sections && this._handleCartSectionsChange(cart.sections)
    }

    async getCart(fetchSections = false): Promise<ShopifyCart> {
      if (this.loadingCartPromise) {
        return this.loadingCartPromise.promise
      }

      this.loadingCartPromise = defer<ShopifyCart>()
      const cart = await this.client<ShopifyCart>('.js', { method: 'GET' })
      this.loadingCartPromise?.resolve(cart)
      this.loadingCartPromise = null
      if (fetchSections) await this.getCartSections()
      return cart
    }

    async _handleCartChange(cart?: ShopifyCart) {
      this.$emit('cart:updated', cart ?? (await this.getCart()))
    }

    async getCartSections() {
      const request = await fetch(
        `${window.location.pathname}?sections=${this.sectionsToFetch}`
      )
      const sections = await request.json()
      this._handleCartSectionsChange(sections)
      return sections as CartSections
    }

    _handleCartSectionsChange(sections: CartSections) {
      if (sections) {
        this.$emit('cart:updated-sections', sections)
      }
    }

    _handleCartError(error: ShopifyCartError) {
      this.$emit('cart:error', error)
      this.shopifyCartError = error as ShopifyCartError
    }

    getCartLinesForVariant(variantId: number) {
      return this.cart.items.filter((item) => item.variant_id === variantId)
    }

    openCartDrawer() {
      this.$emit('modal-dialog::open', CART_DRAWER_DIALOG_ID)
    }
  }

  return WithShopifyCartClientClass as AbstractConstructor<WithApiClientInterface> &
    T
}
