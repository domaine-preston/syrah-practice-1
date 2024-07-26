import BaseElement from './BaseElement'
import { PropertyValueMap } from 'lit'
import { property } from 'lit/decorators.js'

export abstract class FormElement extends BaseElement {
  static formAssociated = true

  @property({ type: Boolean })
  multiple: boolean = false

  @property({ type: String, attribute: 'value', reflect: true })
  _value: string = ''

  @property({ type: String, attribute: 'name' })
  name!: string

  @property({ type: Boolean, attribute: 'disabled' })
  disabled!: boolean

  @property({ type: Boolean })
  required: boolean = false

  @property({ type: String })
  autocomplete!: string

  #internals!: ElementInternals
  _originalValue: string = ''

  static shadowRootOptions = {
    ...BaseElement.shadowRootOptions,
    delegatesFocus: true,
  }

  constructor() {
    super()
    this.#internals = this.attachInternals()
  }

  // Form controls usually expose a "value" property
  get value() {
    return this._value
  }

  get _formValue() {
    if (this.multiple) {
      const values = this._value.split(',')
      const formData = new FormData()
      values.forEach((value) => {
        formData.append(this.name, value)
      })
      return formData
    }
    return this._value
  }

  set value(v: string | number) {
    const previousValue = this._value
    this._value = String(v)
    this.#internals.setFormValue(this._formValue)

    if (previousValue !== this._value) {
      this.$emit('change', {
        value: this._formValue,
        previousValue,
      })
    }
  }

  // The following properties and methods aren't strictly required,
  // but browser-level form controls provide them. Providing them helps
  // ensure consistency with browser-provided controls.
  get form() {
    return this.#internals.form
  }

  get validity() {
    return this.#internals.validity
  }

  get validationMessage() {
    return this.#internals.validationMessage
  }

  get willValidate() {
    return this.#internals.willValidate
  }

  checkValidity() {
    return this.#internals.checkValidity()
  }

  reportValidity() {
    return this.#internals.reportValidity()
  }

  formStateRestoreCallback(state: string) {
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!state) {
      this.value = state
    }
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled
  }

  formResetCallback() {
    this.value = ''
  }

  resetValue() {
    this.value = this._originalValue
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    super.firstUpdated(_changedProperties)
    this._originalValue = this._value
  }
}
