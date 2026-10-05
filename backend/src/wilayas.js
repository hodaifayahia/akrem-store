/**
 * The 58 Algerian wilayas with a flat home-delivery fee in DZD.
 * The server is the source of truth: the client only displays an estimate,
 * POST /api/orders always recomputes the fee from this table.
 */
export const WILAYAS = [
  { code: 1, ar: 'أدرار', fr: 'Adrar', fee: 800 },
  { code: 2, ar: 'الشلف', fr: 'Chlef', fee: 500 },
  { code: 3, ar: 'الأغواط', fr: 'Laglagat', fee: 550 },
  { code: 4, ar: 'أم البواقي', fr: 'Oum El Bouaghi', fee: 550 },
  { code: 5, ar: 'باتنة', fr: 'Batna', fee: 500 },
  { code: 6, ar: 'بجاية', fr: 'Bejaia', fee: 500 },
  { code: 7, ar: 'بسكرة', fr: 'Biskra', fee: 500 },
  { code: 8, ar: 'بشار', fr: 'Bechar', fee: 700 },
  { code: 9, ar: 'البليدة', fr: 'Blida', fee: 350 },
  { code: 10, ar: 'البويرة', fr: 'Bouira', fee: 400 },
  { code: 11, ar: 'تمنراست', fr: 'Tamanrasset', fee: 900 },
  { code: 12, ar: 'تبسة', fr: 'Tebessa', fee: 550 },
  { code: 13, ar: 'تلمسان', fr: 'Tlemcen', fee: 550 },
  { code: 14, ar: 'تيارت', fr: 'Tiaret', fee: 500 },
  { code: 15, ar: 'تيزي وزو', fr: 'Tizi Ouzou', fee: 450 },
  { code: 16, ar: 'الجزائر', fr: 'Alger', fee: 350 },
  { code: 17, ar: 'الجلفة', fr: 'Djelfa', fee: 550 },
  { code: 18, ar: 'جيجل', fr: 'Jijel', fee: 500 },
  { code: 19, ar: 'سطيف', fr: 'Setif', fee: 450 },
  { code: 20, ar: 'سعيدة', fr: 'Saida', fee: 550 },
  { code: 21, ar: 'سكيكدة', fr: 'Skikda', fee: 500 },
  { code: 22, ar: 'سيدي بلعباس', fr: 'Sidi Bel Abbes', fee: 550 },
  { code: 23, ar: 'عنابة', fr: 'Annaba', fee: 450 },
  { code: 24, ar: 'قالمة', fr: 'Guelma', fee: 500 },
  { code: 25, ar: 'قسنطينة', fr: 'Constantine', fee: 450 },
  { code: 26, ar: 'المدية', fr: 'Medea', fee: 450 },
  { code: 27, ar: 'مستغانم', fr: 'Mostaganem', fee: 500 },
  { code: 28, ar: 'المسيلة', fr: "M'Sila", fee: 500 },
  { code: 29, ar: 'معسكر', fr: 'Mascara', fee: 500 },
  { code: 30, ar: 'ورقلة', fr: 'Ouargla', fee: 700 },
  { code: 31, ar: 'وهران', fr: 'Oran', fee: 400 },
  { code: 32, ar: 'البيض', fr: 'El Bayadh', fee: 650 },
  { code: 33, ar: 'إليزي', fr: 'Illizi', fee: 1000 },
  { code: 34, ar: 'برج بوعريريج', fr: 'Boumerdes Arreridj', fee: 450 },
  { code: 35, ar: 'بومرداس', fr: 'Boumerdes', fee: 350 },
  { code: 36, ar: 'الطارف', fr: 'El Tarf', fee: 550 },
  { code: 37, ar: 'تندوف', fr: 'Tindouf', fee: 950 },
  { code: 38, ar: 'تيسمسيلت', fr: 'Tissemsilt', fee: 550 },
  { code: 39, ar: 'الوادي', fr: 'El Oued', fee: 600 },
  { code: 40, ar: 'خنشلة', fr: 'Khenchela', fee: 550 },
  { code: 41, ar: 'سوق أهراس', fr: 'Souk Ahras', fee: 550 },
  { code: 42, ar: 'تيبازة', fr: 'Tipaza', fee: 400 },
  { code: 43, ar: 'ميلة', fr: 'Mila', fee: 500 },
  { code: 44, ar: 'عين الدفلى', fr: 'Ain Defa', fee: 500 },
  { code: 45, ar: 'النعامة', fr: 'Naama', fee: 650 },
  { code: 46, ar: 'عين تموشنت', fr: 'Ain Temouchent', fee: 550 },
  { code: 47, ar: 'غرداية', fr: 'Ghardaia', fee: 650 },
  { code: 48, ar: 'غليزان', fr: 'Relizane', fee: 500 },
  { code: 49, ar: 'تيميمون', fr: 'Timimoun', fee: 850 },
  { code: 50, ar: 'برج باجي مختار', fr: 'Bordj Badji Mokhtar', fee: 1500 },
  { code: 51, ar: 'أولاد جلال', fr: 'Ouled Djellal', fee: 600 },
  { code: 52, ar: 'بني عباس', fr: 'Beni Abbes', fee: 850 },
  { code: 53, ar: 'عين صالح', fr: 'In Salah', fee: 950 },
  { code: 54, ar: 'عين قزام', fr: 'In Guezzam', fee: 1200 },
  { code: 55, ar: 'تقرت', fr: 'Touggourt', fee: 700 },
  { code: 56, ar: 'جانت', fr: 'Djanet', fee: 1200 },
  { code: 57, ar: 'المغير', fr: "El M'Ghair", fee: 650 },
  { code: 58, ar: 'المنيعة', fr: 'El Meniaa', fee: 700 },
]

/** Accepts "16", "Bejaia", "بجاية" (case-insensitive) and returns the wilaya or null. */
export function findWilaya(input) {
  if (input === undefined || input === null) return null
  const q = String(input).trim()
  if (!q) return null
  if (/^\d+$/.test(q)) return WILAYAS.find((w) => w.code === Number(q)) || null
  const lower = q.toLowerCase()
  return WILAYAS.find((w) => w.fr.toLowerCase() === lower || w.ar === q) || null
}

export function deliveryFeeFor(wilaya) {
  return wilaya ? wilaya.fee : 0
}
