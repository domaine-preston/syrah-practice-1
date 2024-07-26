import { createContext } from '@lit/context'

export type ModalContext = string[]

const MODAL_CONTEXT = 'modals'
export const modalContext = createContext<ModalContext>(MODAL_CONTEXT)

export default modalContext
