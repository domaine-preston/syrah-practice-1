// {"token":"Z2NwLXVzLWNlbnRyYWwxOjAxSFhXNjFHUEhKQUZaSjIzUVBCUVJQNjJZ","note":"","attributes":{},"original_total_price":94995,"total_price":94995,"total_discount":0,"total_weight":0.0,"item_count":1,"items":[{"id":44936127742191,"properties":{},"quantity":1,"variant_id":44936127742191,"key":"44936127742191:5cb477e7ff342fccddabcf7fd3b7b34e","title":"The Inventory Not Tracked Snowboard","price":94995,"original_price":94995,"presentment_price":949.95,"discounted_price":94995,"line_price":94995,"original_line_price":94995,"total_discount":0,"discounts":[],"sku":"sku-untracked-1","grams":0,"vendor":"project-syrah","taxable":true,"product_id":8431803007215,"product_has_only_default_variant":true,"gift_card":false,"final_price":94995,"final_line_price":94995,"url":"\/products\/the-inventory-not-tracked-snowboard?variant=44936127742191","featured_image":{"aspect_ratio":0.792,"alt":"Top and bottom view of a snowboard. The top view shows a centred hexagonal logo for Hydrogen that\n          appears to radiate outwards, as well as some overlapping hexagons at the bottom. The bottom view shows an\n          abstract angular grid in purples.","height":3908,"url":"https:\/\/cdn.shopify.com\/s\/files\/1\/0698\/0737\/4575\/files\/snowboard_purple_hydrogen.png?v=1713476256","width":3097},"image":"https:\/\/cdn.shopify.com\/s\/files\/1\/0698\/0737\/4575\/files\/snowboard_purple_hydrogen.png?v=1713476256","handle":"the-inventory-not-tracked-snowboard","requires_shipping":true,"product_type":"","product_title":"The Inventory Not Tracked Snowboard","product_description":null,"variant_title":null,"variant_options":["Default Title"],"options_with_values":[{"name":"Title","value":"Default Title"}],"line_level_discount_allocations":[],"line_level_total_discount":0,"quantity_rule":{"min":1,"max":null,"increment":1},"has_components":false}],"requires_shipping":true,"currency":"USD","items_subtotal_price":94995,"cart_level_discount_applications":[]}

type ShopifyImage = {
  alt: string
  aspect_ratio: number
  height: number
  url: string
  width: number
}
export interface ShopifyCartLineItem {
  discounted_price: number
  discounts: unknown[]
  featured_image: ShopifyImage
  final_line_price: number
  final_price: number
  gift_card: boolean
  grams: number
  handle: string
  has_components: boolean
  id: string
  image: string
  key: string
  line_level_discount_allocations: unknown[]
  line_level_total_discount: number
  line_price: number
  options_with_values: { name: string; value: string }[]
  original_line_price: number
  original_price: number
  presentment_price: number
  price: number
  product_description: string | null
  product_has_only_default_variant: boolean
  product_id: number
  product_title: string
  product_type: string
  properties: Record<string, string | number | boolean>
  quantity: number
  quantity_rule: { min: number; max: number | null; increment: number }
  requires_shipping: boolean
  sku: string
  taxable: boolean
  title: string
  total_discount: number
  url: string
  variant_id: number
  variant_options: string[]
  variant_title: string | null
  vendor: string | null
}

export interface ShopifyCart {
  attributes: Record<string, string | number | boolean>
  cart_level_discount_applications: unknown[]
  currency: string
  item_count: number
  items: ShopifyCartLineItem[]
  items_subtotal_price: number
  note: string
  original_total_price: number
  requires_shipping: boolean
  total_discount: number
  total_price: number
  total_weight: number
  sections?: Record<string, string | null>
}

export interface ShopifyCartError {
  description: string
  message: string
  status: number
}

export type AddToShopifyCartResponse = Pick<ShopifyCart, 'items' | 'sections'>

type CartItemProperty = Record<string, string | number | boolean>

export interface CartItemPayload {
  id: string | number
  line?: number
  quantity: number
  selling_plan?: string | number | null
  properties?: CartItemProperty
}

export type UpdateCartPayload = Record<string | number, number>

export interface AddCartItemPayload {
  items: CartItemPayload[]
}
