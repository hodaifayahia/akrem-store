export const CATEGORIES = ['smartphones', 'laptops', 'accessories']

export const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled']

/** Cash on delivery is the only payment method supported (standard in Algeria). */
export const DELIVERY_METHOD = 'cod'

export const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price_dzd ASC',
  price_desc: 'p.price_dzd DESC',
}
