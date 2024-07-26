import type BaseElement from '@/base/BaseElement'
import { ARIA_LIVE_REGION_EVENTS } from '@/contexts/aria-live-region-context'
import type { AriaLiveRegionContext } from '@/custom_typings/app'
import { ReactiveController, ReactiveControllerHost } from 'lit'

export class LiveRegionUtility implements ReactiveController {
  host: ReactiveControllerHost

  constructor(host: ReactiveControllerHost) {
    ;(this.host = host).addController(this)
  }

  hostDisconnected() {}

  announce(message: AriaLiveRegionContext) {
    ;(this.host as BaseElement).$emit(ARIA_LIVE_REGION_EVENTS.SET, message)

    setTimeout(() => {
      this.clear()
    }, 2000)
  }

  clear() {
    ;(this.host as BaseElement).$emit(ARIA_LIVE_REGION_EVENTS.CLEAR)
  }
}
