import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import { WithApiClientMixin } from '@/mixins/WithApiClient'
import { Task } from '@lit/task'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

// This is a custom element that will render a product card based on the provided variantId or product handle.
// <dynamic-product-card template='product-card-simple' variant-id='44867697705233'></dynamic-product-card>
// <dynamic-product-card variant-id='44867697705233'></dynamic-product-card>
// <dynamic-product-card handle='artichoke-lemon'></dynamic-product-card>
type StorefrontVariantQuery = {
  data: {
    node: {
      id: string
      product: {
        handle: string
      }
    }
  }
}

const GET_PRODUCT_VARIANTS_FROM_NODE = `#graphql
  query getProductVariantsFromNode($id: ID!) {
    node(id: $id) {
      id
      ... on ProductVariant {
        product {
          handle
        }
      }
    }
  }
`

const CACHE: Record<string, string> = {}
const VARIANT_HANDLE_CACHE: Record<string, string> = {}

@customElement('dynamic-product-card')
export class DynamicProductCard extends WithApiClientMixin(
  BaseElementWithoutShadowDOM
) {
  @property({ type: String, attribute: 'variant-id' })
  variantId: string | undefined

  @property({ type: String })
  handle: string | undefined

  @property({ type: String })
  template: string = 'product-card'

  createRenderRoot() {
    return this
  }

  get cacheKey() {
    return `${this.handle}-${this.variantId}-${this.template}`
  }

  checkIfResponseHasLayout = (response: string) => {
    return response.match(/html|body/)
  }

  private _loadVariantByIdTask = new Task(this, {
    task: async ([variantId]: (string | undefined)[]) => {
      if (!variantId) {
        throw new Error('No variantId provided')
      }

      if (VARIANT_HANDLE_CACHE[variantId]) {
        return VARIANT_HANDLE_CACHE[variantId]
      }

      const request = await this.$api.client.storefront<StorefrontVariantQuery>(
        {
          body: {
            query: GET_PRODUCT_VARIANTS_FROM_NODE,
            variables: {
              id: `gid://shopify/ProductVariant/${variantId}`,
            },
          },
        }
      )

      if (!request.data?.node?.product?.handle) {
        throw new Error('No product handle found')
      }

      VARIANT_HANDLE_CACHE[variantId] = request.data?.node?.product?.handle
      return VARIANT_HANDLE_CACHE[variantId]
    },
    args: () => [this.variantId],
  })

  loadProductHandleView = new Task(this, {
    task: async ([handle]: (string | undefined)[]) => {
      if (!handle) {
        throw new Error('No handle provided')
      }

      if (CACHE[this.cacheKey]) {
        return CACHE[this.cacheKey]
      }

      const request = await this.$api.client.shopify<string>(
        `products/${handle}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'text/html',
          },
        },
        {
          params: {
            view: this.template,
            layout: 'none',
            ...(this.variantId && {
              variant: this.variantId,
            }),
          },
        }
      )
      if (this.checkIfResponseHasLayout(request)) {
        throw new Error('Invalid response')
      }

      if (request) {
        CACHE[this.cacheKey] = request
        return request
      }

      throw new Error('No product found')
    },
    args: () => [
      this.handle || this._loadVariantByIdTask.value,
      this.variantId,
    ],
  })

  render() {
    return html`
      ${this.loadProductHandleView.render({
        complete: (data) => {
          if (!data) return
          return html`${unsafeHTML(data)}`
        },
      })}
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dynamic-product-card': DynamicProductCard
  }
}
