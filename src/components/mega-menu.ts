import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import { PropertyValueMap } from 'lit'
import { customElement, queryAll, state } from 'lit/decorators.js'

@customElement('mega-menu')
export class MegaMenu extends BaseElementWithoutShadowDOM {
  static EXIT_TIMEOUT = 300
  @state()
  activeElement: HTMLElement | undefined = undefined

  @queryAll('[menu]')
  private menus!: NodeListOf<HTMLElement>

  @queryAll('[menu-trigger]')
  private menuTriggers!: NodeListOf<HTMLElement>

  exitTimer: number | undefined

  constructor() {
    super()
    this._handlePointerEnter = this._handlePointerEnter.bind(this)
    this._handlePointerOut = this._handlePointerOut.bind(this)
    this._handleMenuPointerEnter = this._handleMenuPointerEnter.bind(this)
    this._handleMenuPointerOut = this._handleMenuPointerOut.bind(this)
    this._handleButtonFocus = this._handleButtonFocus.bind(this)
    this.startExitTimer = this.startExitTimer.bind(this)
    this.stopExitTimer = this.stopExitTimer.bind(this)
    this.activateMenuWithControl = this.activateMenuWithControl.bind(this)
  }

  get ctor() {
    return this.constructor as typeof MegaMenu
  }

  connectedCallback(): void {
    super.connectedCallback()
    Array.from(this.menuTriggers).forEach((button) => {
      button.addEventListener('pointerover', this._handlePointerEnter)
      button.addEventListener('pointerout', this._handlePointerOut)
      button.addEventListener('focus', this._handleButtonFocus)
    })

    Array.from(this.menus).forEach((menu) => {
      menu.addEventListener('pointerover', this._handleMenuPointerEnter)
      menu.addEventListener('pointerout', this._handleMenuPointerOut)
    })
  }

  _handleActivateButton(button: HTMLElement): void {
    if (button.getAttribute('aria-controls')) {
      this.stopExitTimer()
      this.activeElement = button
    } else {
      this.activeElement = undefined
    }
  }

  _handlePointerEnter(event: PointerEvent): void {
    const button = event.currentTarget as HTMLElement
    this._handleActivateButton(button)
  }

  _handlePointerOut(event: PointerEvent): void {
    const button = event.currentTarget as HTMLElement
    if (this.activeElement === button) {
      this.startExitTimer()
    }
  }

  _handleMenuPointerEnter(): void {
    this.stopExitTimer()
  }

  _handleMenuPointerOut(): void {
    this.startExitTimer()
  }

  _handleButtonFocus(event: FocusEvent): void {
    const button = event.currentTarget as HTMLElement
    this._handleActivateButton(button)
  }

  startExitTimer(): void {
    this.exitTimer = window.setTimeout(() => {
      this.activeElement = undefined
    }, this.ctor.EXIT_TIMEOUT)
  }

  stopExitTimer(): void {
    if (this.exitTimer) {
      window.clearTimeout(this.exitTimer)
    }
  }

  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    super.updated(_changedProperties)
    if (_changedProperties.has('activeElement')) {
      this.activateMenuWithControl(this.activeElement)
    }
  }

  activateMenuWithControl(control: HTMLElement | undefined): void {
    for (const button of Array.from(this.menuTriggers)) {
      const buttonControls = button.getAttribute('aria-controls')
      if (buttonControls && button === control) {
        button.setAttribute('aria-expanded', 'true')
      } else {
        button.setAttribute('aria-expanded', 'false')
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mega-menu': MegaMenu
  }
}
