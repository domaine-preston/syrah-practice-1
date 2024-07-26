import type { AriaLiveRegionContext } from '@/custom_typings/app'
import { createContext } from '@lit/context'

const CONTEXT = 'aria-live-region-context'
export const context = createContext<AriaLiveRegionContext>(CONTEXT)

export default context

export const ARIA_LIVE_REGION_EVENTS = {
  SET: 'aria-live-region::set',
  CLEAR: 'aria-live-region::clear',
}
