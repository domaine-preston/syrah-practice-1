import BaseElement from '@/base/BaseElement'
import { WithModalDialog } from '@/mixins/WithModalDialog'
import { PropertyValueMap, html } from 'lit'
import { customElement, queryAssignedElements } from 'lit/decorators.js'

@customElement('dialog-toggle')
export class ModalDialogToggle extends WithModalDialog(BaseElement) {
  @queryAssignedElements()
  assignedElements!: HTMLElement[]

  onClick(e: Event) {
    if (!this.modalId) return
    e.preventDefault()

    if (!this.modalIsOpen) {
      this.openModal()
    } else {
      this.closeModal()
    }
  }

  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    super.updated(_changedProperties)

    this.toggleAttribute('open', this.modalIsOpen)
    this.assignedElements?.forEach((el) => {
      el.toggleAttribute('open', this.modalIsOpen)
      el.setAttribute('aria-expanded', String(this.modalIsOpen))
    })
  }

  render() {
    return html`<slot @click="${this.onClick}"></slot>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dialog-toggle': ModalDialogToggle
  }
}
