import type BaseElement from '@/base/BaseElement'
import modalContext, { type ModalContext } from '@/contexts/modal-context'
import { consume } from '@lit/context'
import { property } from 'lit/decorators.js'

export declare class WithModalDialogInterface {
  modalId: string
  modals: ModalContext
  openModal: () => void
  closeModal: () => void
  closeAllModals: () => void
  modalIsOpen: boolean
}

export const WithModalDialog = <T extends AbstractConstructor<BaseElement>>(
  superClass: T
) => {
  abstract class WithModalDialogClass
    extends superClass
    implements WithModalDialogInterface
  {
    @consume({ context: modalContext, subscribe: true })
    modals!: ModalContext

    @property({ type: String, attribute: 'modal-id' })
    modalId!: string

    get currentTargetId() {
      if (this.tagName === 'DIALOG-TOGGLE' || this.tagName === 'QUICK-SHOP') {
        return this.modalId
      }

      return this.id
    }

    get modalIsOpen() {
      return !!(
        this.currentTargetId && this.modals.includes(this.currentTargetId)
      )
    }

    openModal() {
      if (!this.currentTargetId || this.modalIsOpen) return
      this.$emit('modal-dialog::open', this.currentTargetId)
    }

    closeModal() {
      if (!this.currentTargetId || !this.modalIsOpen) return
      this.$emit('modal-dialog::close', this.currentTargetId)
    }

    closeAllModals() {
      this.$emit('modal-dialog::close-all')
    }
  }
  // Cast return type to your mixin's interface intersected with the superClass type
  return WithModalDialogClass as AbstractConstructor<WithModalDialogInterface> &
    T
}
