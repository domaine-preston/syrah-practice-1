import { type ModalDialog } from './core-dialog'
import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import quickShopContext, { QuickShopContext } from '@/contexts/quickshop'
import { WithModalDialog } from '@/mixins/WithModalDialog'
import { consume } from '@lit/context'
import { PropertyValues } from 'lit'
import { customElement, query } from 'lit/decorators.js'

@customElement('quick-shop')
export class QuickShop extends WithModalDialog(BaseElementWithoutShadowDOM) {
  @query('modal-dialog')
  $dialog!: ModalDialog

  @consume({ context: quickShopContext, subscribe: true })
  quickShop!: QuickShopContext

  protected updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties)
    if (this.quickShop) {
      this.$dialog.url = this.quickShop
      this.openModal()
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties)

    if (!this.quickShop) {
      return this.closeModal()
    }
  }
}
