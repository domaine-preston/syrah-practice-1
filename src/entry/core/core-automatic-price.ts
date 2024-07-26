import BaseElement from '@/base/BaseElement'
import { WithApiClientMixin } from '@/mixins/WithApiClient'
import { Task, TaskStatus } from '@lit/task'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

const CREATE_CART_WITH_VARIANT = /* GraphQL */ `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        lines(first: 1) {
          nodes {
            id
          }
        }

        cost {
          subtotalAmount {
            amount
            currencyCode
          }

          totalAmount {
            amount
            currencyCode
          }
        }

        discountAllocations {
          discountedAmount {
            amount
            currencyCode
          }

          targetType
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

type DiscountAllocation = {
  discountedAmount: {
    amount: string
    currencyCode: string
  }
  targetType: string
}

type CreateCartWithVariant = {
  data: {
    cartCreate: {
      cart: {
        lines: {
          nodes: {
            id: string
          }[]
        }
        cost: {
          subtotalAmount: {
            amount: string
            currencyCode: string
          }
          totalAmount: {
            amount: string
            currencyCode: string
          }
        }
        discountAllocations: DiscountAllocation[]
      }
      userErrors: {
        field: string
        message: string
      }[]
    }
  }
}

type CartLineDetails = {
  subtotalAmount: number
  totalAmount: number
  discountAllocations: DiscountAllocation[]
  currencyCode: string
}

const VARIANT_PRICE_CACHE = new Map<string, CartLineDetails>()

@customElement('automatic-price')
export class AutomaticPrice extends WithApiClientMixin(BaseElement) {
  @property({ type: String, attribute: 'variant-id' })
  variantId!: string

  @property({ type: String, attribute: 'selling-plan-id' })
  sellingPlanId!: string

  @property({ type: Number })
  currentPrice!: number

  @property({ type: Boolean, attribute: 'hide-while-loading' })
  hideWhileLoading = false

  private fetchPriceTask = new Task(this, {
    task: async ([variantId]) => {
      const cachedPrice = VARIANT_PRICE_CACHE.get(variantId)
      if (cachedPrice) {
        return cachedPrice
      }

      const { data } = await this.$api.client.storefront<CreateCartWithVariant>(
        {
          body: {
            query: CREATE_CART_WITH_VARIANT,
            variables: {
              input: {
                lines: [
                  {
                    quantity: 1,
                    merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
                    ...(this.sellingPlanId && {
                      sellingPlanId: `gid://shopify/SellingPlan/${this.sellingPlanId}`,
                    }),
                  },
                ],
              },
            },
          },
        }
      )

      if (data.cartCreate.userErrors.length) {
        throw new Error(data.cartCreate.userErrors[0].message)
      }

      const cart = data.cartCreate.cart

      if (cart.discountAllocations.length === 0) {
        throw new Error('No discount allocations found')
      }

      const subtotalAmount = Number(cart.cost.subtotalAmount.amount) * 100 // The cost of the merchandise line before line-level discounts.
      const totalAmount = Number(cart.cost.totalAmount.amount) * 100 // The total cost of the merchandise line.
      const priceDetails = {
        subtotalAmount,
        totalAmount,
        discountAllocations: cart.discountAllocations,
        currencyCode: cart.cost.totalAmount.currencyCode,
      }

      VARIANT_PRICE_CACHE.set(variantId, priceDetails)
      return priceDetails
    },
    args: () => [this.variantId],
  })

  get hasAutomaticDiscount() {
    if (
      this.fetchPriceTask.status != TaskStatus.COMPLETE ||
      !this.fetchPriceTask.value
    ) {
      return false
    }

    const { totalAmount, subtotalAmount } = this.fetchPriceTask.value
    const currentPrice = this.currentPrice

    return totalAmount < subtotalAmount || totalAmount < currentPrice
  }

  get updatedPriceHTML() {
    if (
      this.fetchPriceTask.status != TaskStatus.COMPLETE ||
      !this.fetchPriceTask.value
    ) {
      return html`<slot></slot>`
    }

    const { totalAmount, currencyCode } = this.fetchPriceTask.value
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    })

    return html` <span>${formatter.format(totalAmount / 100)}</span> `
  }

  render() {
    return this.fetchPriceTask.render({
      initial: () => html`<slot></slot>`,
      pending: () =>
        this.hideWhileLoading
          ? html`<span class="animate-pulse">----.--</span>`
          : html`<slot></slot>`,
      complete: () => {
        if (this.hasAutomaticDiscount) {
          return this.updatedPriceHTML
        }
        return html`<slot></slot>`
      },
      error: () => html`<slot></slot>`,
    })
  }
}

// create a task to fetch price from cart with discount allocation
// if price is fetched, update the price in the DOM
