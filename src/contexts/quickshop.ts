import { createContext } from '@lit/context'

const CONTEXT = 'quickshop'
export const context = createContext<QuickShopContext>(CONTEXT)

export type QuickShopContext = string | null

export default context
