import { BaseElementWithoutShadowDOM } from '@/base/BaseElement'
import { type PropertyValueMap } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

@customElement('country-selects')
export class CountrySelects extends BaseElementWithoutShadowDOM {
  @query('[data-country-select] select')
  private countrySelect!: HTMLSelectElement

  @query('[data-province-select]')
  private provinceSelectField!: HTMLElement

  @query('[data-province-select] select')
  private provinceSelect!: HTMLSelectElement

  @property({ type: String })
  public country!: string

  @property({ type: String })
  public province!: string

  constructor() {
    super()
    this._handleCountryChange = this._handleCountryChange.bind(this)
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    super.firstUpdated(_changedProperties)
    if (this.countrySelect && this.country) {
      this.countrySelect.value = this.country
    }

    if (this.provinceSelect && this.province) {
      this.provinceSelect.value = this.province
    }

    this.countrySelect?.addEventListener('change', this._handleCountryChange)
    this._handleCountryChange()
  }

  _handleCountryChange() {
    if (!this.countrySelect) return
    const selectedOption = this.countrySelect.selectedOptions[0]
    if (selectedOption) {
      const provinces = JSON.parse(selectedOption.dataset.provinces as string)
      if (provinces && provinces.length > 0) {
        this.provinceSelect.innerHTML = ''
        this.provinceSelect.required = provinces.length > 0
        provinces.forEach(
          ([provinceValue, provinceLabel]: [string, string]) => {
            const option = document.createElement('option')
            option.value = provinceValue
            option.text = provinceLabel
            option.selected = this.province === provinceValue
            this.provinceSelect.appendChild(option)
          }
        )

        this.provinceSelectField.style.display = ''
      } else {
        this.provinceSelect.required = false
        this.provinceSelect.innerHTML = ''
        this.provinceSelectField.style.display = 'none'
      }
    }
  }
}
