import type { DeferredMedia } from '@/entry/core/core-deferred-media'
import { createContext } from '@lit/context'

const CONTEXT = 'deferred-media'
export const context = createContext<DeferredMediaContext>(CONTEXT)

export type DeferredMediaContext = DeferredMedia | null

export default context
