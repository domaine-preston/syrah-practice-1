import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import HTMLUpdateUtility from '@/mixins/HTMLUpdateUtility'
import { PropertyValueMap } from 'lit'
import { customElement, property } from 'lit/decorators.js'

// Add option to load based on intersection observer only on viewport entry
// <section-injection section-name="section-name"></section-injection>
@customElement('section-injection')
export class SectionInjection extends BaseElementWithoutShadowDOM {
  $htmlUpdateUtility: HTMLUpdateUtility = new HTMLUpdateUtility(this, [
    'section-name',
    'base-url',
    'params',
    'id',
  ])

  @property({ type: String, attribute: 'section-name' })
  sectionName = ''

  @property({ type: String, attribute: 'base-url' })
  _baseUrl = ''

  @property({ type: String })
  params: string = ''

  @property({ type: String })
  get baseurl() {
    return this._baseUrl || window.Shopify?.routes?.root || '/'
  }

  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    super.updated(_changedProperties)

    if (
      _changedProperties.has('params') &&
      this.params !== _changedProperties.get('params') &&
      !!this.params
    ) {
      this.fetch()
    }
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    super.firstUpdated(_changedProperties)
    this.fetch()
  }

  get paramsObjectFromString() {
    const params = new URLSearchParams(this.params)
    return Object.fromEntries(params)
  }

  fetch() {
    this.$htmlUpdateUtility
      .fetchAndReplaceSectionId({
        renderRoot: this,
        sectionId: this.sectionName,
        baseUrl: this.baseurl,
        params: this.paramsObjectFromString,
        withCache: true,
      })
      .catch(console.warn)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'section-injection': SectionInjection
  }
}
