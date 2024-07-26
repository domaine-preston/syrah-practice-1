import BaseElement from '@/base/BaseElement'
import { WithApiClientMixin } from '@/mixins/WithApiClient'
import { Task, TaskStatus } from '@lit/task'
import { html, nothing } from 'lit'
import { customElement } from 'lit/decorators.js'

const CREATE_CART_WITH_GIFT_CARD = /* GraphQL */ `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        appliedGiftCards {
          amountUsed {
            amount
            currencyCode
          }

          balance {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

type CartWithGiftCartCreate = {
  data: {
    cartCreate: {
      cart: {
        appliedGiftCards: {
          amountUsed: {
            amount: string
            currencyCode: string
          }
          balance: {
            amount: string
            currencyCode: string
          }
        }[]
      }
      userErrors: {
        field: string
        message: string
      }[]
    }
  }
}

@customElement('gift-card-balance')
export class GiftCardBalance extends WithApiClientMixin(BaseElement) {
  private fetchCartWithGiftCardTask = new Task(this, {
    task: async ([code]: [string]) => {
      const { data } =
        await this.$api.client.storefront<CartWithGiftCartCreate>({
          body: {
            query: CREATE_CART_WITH_GIFT_CARD,
            variables: {
              input: {
                giftCardCodes: [code],
              },
            },
          },
        })
      const userErrors = data.cartCreate.userErrors
      const giftCards = data.cartCreate.cart.appliedGiftCards

      if (userErrors.length > 0) {
        throw new Error(userErrors[0].message)
      }

      if (giftCards.length === 0) {
        throw new Error('Gift card not found')
      }

      return giftCards[0]
    },
    autoRun: false,
  })

  async handleSubmit(e: Event) {
    e.preventDefault()
    if (this.fetchCartWithGiftCardTask.status === TaskStatus.PENDING) {
      return
    }

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const code = formData.get('code') as string

    if (!code || code.trim() === '') {
      return
    }
    await this.fetchCartWithGiftCardTask.run([code.trim()])
  }

  get resultHTML() {
    if (this.fetchCartWithGiftCardTask.status === TaskStatus.PENDING) {
      return html`<p class="caption">Loading...</p>`
    }

    if (this.fetchCartWithGiftCardTask.status === TaskStatus.ERROR) {
      return html`<p class="caption p-xs text-u-error ring-1 ring-u-error">
        ${(this.fetchCartWithGiftCardTask.error as Error).message}
      </p>`
    }

    if (
      this.fetchCartWithGiftCardTask.status === TaskStatus.COMPLETE &&
      this.fetchCartWithGiftCardTask.value
    ) {
      const giftCartBalance = this.fetchCartWithGiftCardTask.value
      return html`
        <span class="utility"
          >Balance: ${giftCartBalance.balance.amount}
          ${giftCartBalance.balance.currencyCode}</span
        >
      `
    }

    return nothing
  }

  render() {
    return html`
      <slot @submit=${this.handleSubmit}></slot>
      ${this.resultHTML}
    `
  }
}
