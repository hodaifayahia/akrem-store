import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { formatDZD } from '../lib/format'
import type { Category, OrderStatus } from '../lib/format'
import type { Product } from '../lib/api'

export type Lang = 'ar' | 'fr'

/* ==========================================================================
   Arabic is the source of truth; the French dictionary is typed as
   Record<Key, string> so TypeScript fails the build on a missing key.
   ========================================================================== */
const ar = {
  'nav.home': 'الرئيسية',
  'nav.shop': 'المتجر',
  'nav.categories': 'التصنيفات',
  'nav.track': 'تتبع الطلب',
  'nav.about': 'من نحن',
  'nav.admin': 'لوحة التحكم',

  'header.cart': 'السلة',
  'header.cartEmpty': 'السلة فارغة',
  'header.theme': 'تبديل المظهر',
  'header.lang': 'تغيير اللغة',

  'hero.badge': 'متاح للطلب الآن',
  'hero.title': 'عالم الهواتف بين يديك!',
  'hero.subtitle': 'هواتف ذكية أصلية 100%، أسعار واضحة بالدينار الجزائري، وضمان لمدة سنة مع توصيل سريع إلى جميع ولايات الوطن.',
  'hero.p1': 'ابحث عن iPhone او Samsung او Xiaomi…',
  'hero.p2': 'اكتب اسم الماركة أو الموديل…',
  'hero.p3': 'ابحث عن أرخص سعر في الجزائر…',
  'hero.cta': 'اطلب عبر واتساب',
  'hero.ctaShop': 'تصفح المتجر',
  'hero.search': 'بحث',

  'trust.authentic': 'أصلي 100%',
  'trust.wilayas': '69 ولاية',
  'trust.warranty': 'ضمان لمدة سنة',
  'trust.delivery': 'توصيل سريع 24 س',

  'cat.smartphones': 'هواتف ذكية',
  'cat.laptops': 'حاسبات محمولة',
  'cat.accessories': 'إكسسوارات',

  'home.catTitle': 'تسوّق حسب التصنيف',
  'home.catSubtitle': 'كل ما تحتاجه من هواتف وحاسبات وإكسسوارات في مكان واحد.',
  'home.featuredTitle': 'وصل حديثاً',
  'home.featuredSubtitle': 'أحدث الأجهزة بأسعار تنافسية وكميات محدودة.',
  'home.newTitle': 'جديد في المتجر',
  'home.newSubtitle': 'أحدث ما أضفناه إلى الكتالوج.',
  'home.viewAll': 'عرض الكل',
  'home.statsTitle': 'لماذا تختارنا؟',
  'home.statsText': 'متجر جزائري متخصص في الهواتف الذكية، نختار كل جهاز بأنفسنا، نختبره قبل الشحن، ونسلّمه إلى باب منزلك في كل ولايات الوطن مع إمكانية الدفع عند الاستلام.',
  'home.statProducts': 'منتجات أصلية',
  'home.statWilayas': 'ولاية مغطاة',
  'home.statRating': 'متوسط التقييم',

  'footer.tagline': 'متجر الهواتف الذكية الأول في الجزائر. منتجات أصلية، أسعار واضحة، وتوصيل إلى بابك.',
  'footer.quickLinks': 'روابط سريعة',
  'footer.categories': 'الفئات',
  'footer.contact': 'تواصل معنا',
  'footer.rights': '© 2026 أكـرم موبايل — كل الحقوق محفوظة',
  'footer.madeIn': 'صُنع في الجزائر',

  'common.addToCart': 'أضف إلى السلة',
  'common.added': 'تمت الإضافة إلى السلة',
  'common.outOfStock': 'نفدت الكمية',
  'common.inStock': 'متوفر',
  'common.lowStock': 'الكمية محدودة',
  'common.loading': 'جارٍ التحميل…',
  'common.error': 'حدث خطأ، حاول من جديد',
  'common.retry': 'إعادة المحاولة',
  'common.save': 'حفظ',
  'common.cancel': 'إلغاء',
  'common.delete': 'حذف',
  'common.edit': 'تعديل',
  'common.add': 'إضافة',
  'common.close': 'إغلاق',
  'common.price': 'السعر',
  'common.quantity': 'الكمية',
  'common.total': 'المجموع',
  'common.results': 'نتيجة',
  'common.noResults': 'لا توجد منتجات مطابقة',
  'common.brand': 'الماركة',
  'common.rating': 'التقييم',
  'common.new': 'جديد',
  'common.products': 'منتج',
  'common.home': 'الرئيسية',

  'product.specs': 'المواصفات',
  'product.related': 'منتجات ذات صلة',
  'product.description': 'الوصف',
  'product.qty': 'الكمية',
  'product.inStock': 'متوفر في المخزون',
  'product.soldOut': 'نفدت الكمية',
  'product.ram': 'الذاكرة العشوائية',
  'product.storage': 'التخزين',
  'product.screen': 'الشاشة',
  'product.battery': 'البطارية',
  'product.back': 'رجوع',

  'cart.title': 'سلة التسوق',
  'cart.empty': 'سلتك فارغة',
  'cart.emptyText': 'أضف بعض المنتجات لتظهر هنا.',
  'cart.continue': 'متابعة التسوق',
  'cart.checkout': 'إتمام الطلب',
  'cart.remove': 'حذف',
  'cart.subtotal': 'المجموع الفرعي',
  'cart.delivery': 'سعر التوصيل',
  'cart.deliveryAtCheckout': 'يُحتسب في صفحة إتمام الطلب',
  'cart.items': 'المنتجات',
  'cart.clear': 'إفراغ السلة',

  'checkout.title': 'إتمام الطلب',
  'checkout.sub': 'املأ معلوماتك وسنتصل بك لتأكيد الطلب.',
  'checkout.name': 'الاسم الكامل',
  'checkout.namePlaceholder': 'مثال: محمد أمين بلقاسم',
  'checkout.phone': 'رقم الهاتف',
  'checkout.phonePlaceholder': '0555 12 34 56',
  'checkout.wilaya': 'الولاية',
  'checkout.wilayaPlaceholder': 'اختر ولايتك',
  'checkout.commune': 'البلدية',
  'checkout.communePlaceholder': 'مثال: بئر مراد رايس',
  'checkout.address': 'العنوان',
  'checkout.addressPlaceholder': 'الحي، الشارع، رقم المنزل…',
  'checkout.note': 'ملاحظات',
  'checkout.notePlaceholder': 'أي معلومة إضافية تساعد التوصيل',
  'checkout.payment': 'طريقة الدفع',
  'checkout.cod': 'الدفع عند الاستلام (COD)',
  'checkout.submit': 'تأكيد الطلب',
  'checkout.placing': 'جارٍ تسجيل الطلب…',
  'checkout.emptyCart': 'سلتك فارغة، أضف منتجاً أولاً.',
  'checkout.errName': 'أدخل الاسم الكامل (3 أحرف على الأقل)',
  'checkout.errPhone': 'أدخل رقم هاتف جزائري صحيح (0[5-7]…)',
  'checkout.errWilaya': 'اختر ولايتك',
  'checkout.errCommune': 'أدخل البلدية',
  'checkout.errAddress': 'أدخل عنواناً واضحاً',

  'order.successTitle': 'تم استلام طلبك بنجاح!',
  'order.successText': 'سنتصل بك خلال 24 ساعة لتأكيد الطلب. احتفظ برقم المرجع لتتبع طلبك.',
  'order.reference': 'رقم المرجع',
  'order.items': 'المنتجات',
  'order.delivery': 'التوصيل',
  'order.total': 'المجموع',
  'order.cod': 'الدفع عند الاستلام',
  'order.trackCta': 'تتبع الطلب',
  'order.continue': 'العودة إلى المتجر',

  'track.title': 'تتبع طلبك',
  'track.sub': 'أدخل رقم المرجع الذي استلمته بعد الطلب.',
  'track.placeholder': 'AKR-20260101-AB12',
  'track.submit': 'تتبع',
  'track.notFound': 'لم نعثر على طلب بهذا الرقم',
  'track.status': 'الحالة',

  'admin.login': 'تسجيل الدخول',
  'admin.password': 'كلمة المرور',
  'admin.signin': 'دخول',
  'admin.dashboard': 'لوحة التحكم',
  'admin.orders': 'الطلبات',
  'admin.products': 'المنتجات',
  'admin.logout': 'تسجيل الخروج',
  'admin.statProducts': 'المنتجات',
  'admin.statOrders': 'الطلبات',
  'admin.statRevenue': 'رقم الأعمال (بدون الملغاة)',
  'admin.statLowStock': 'منتجات مخزونها ≤ 5',
  'admin.customer': 'الزبون',
  'admin.ref': 'المرجع',
  'admin.date': 'التاريخ',
  'admin.wilaya': 'الولاية',
  'admin.status': 'الحالة',
  'admin.actions': 'إجراءات',
  'admin.newProduct': 'منتج جديد',
  'admin.editProduct': 'تعديل المنتج',
  'admin.deleteConfirm': 'هل تريد حذف هذا المنتج؟',
  'admin.noOrders': 'لا توجد طلبات بعد',
  'admin.noProducts': 'لا توجد منتجات',
  'admin.name': 'الاسم (عربي)',
  'admin.nameFr': 'الاسم (فرنسي)',
  'admin.image': 'رابط الصورة',
  'admin.featured': 'منتج مميز',
  'admin.description': 'الوصف',
  'admin.invalidToken': 'الرجاء تسجيل الدخول من جديد',
  'admin.loginFailed': 'كلمة المرور غير صحيحة',
  'admin.saved': 'تم الحفظ',
  'admin.deleted': 'تم الحذف',
  'admin.searchPlaceholder': 'ابحث أو ابدأ الكتابة…',

  'status.new': 'جديد',
  'status.confirmed': 'مؤكد',
  'status.shipped': 'تم الشحن',
  'status.delivered': 'تم التوصيل',
  'status.cancelled': 'ملغى',
} as const

export type TKey = keyof typeof ar

const fr: Record<TKey, string> = {
  'nav.home': 'Accueil',
  'nav.shop': 'Boutique',
  'nav.categories': 'Catégories',
  'nav.track': 'Suivre ma commande',
  'nav.about': 'À propos',
  'nav.admin': 'Administration',

  'header.cart': 'Panier',
  'header.cartEmpty': 'Le panier est vide',
  'header.theme': 'Changer le thème',
  'header.lang': 'Changer de langue',

  'hero.badge': 'Disponible à la commande',
  'hero.title': 'Le monde du téléphone entre vos mains !',
  'hero.subtitle':
    "Des smartphones 100 % authentiques, des prix clairs en dinar algérien, une garantie d'un an et une livraison rapide dans toutes les wilayas.",
  'hero.p1': 'Recherchez iPhone, Samsung, Xiaomi…',
  'hero.p2': 'Tapez la marque ou le modèle…',
  'hero.p3': 'Trouvez le meilleur prix en Algérie…',
  'hero.cta': 'Commander sur WhatsApp',
  'hero.ctaShop': 'Voir la boutique',
  'hero.search': 'Rechercher',

  'trust.authentic': '100 % original',
  'trust.wilayas': '69 wilayas',
  'trust.warranty': 'Garantie 1 an',
  'trust.delivery': 'Livraison 24 h',

  'cat.smartphones': 'Smartphones',
  'cat.laptops': 'Ordinateurs portables',
  'cat.accessories': 'Accessoires',

  'home.catTitle': 'Achetez par catégorie',
  'home.catSubtitle': 'Téléphones, ordinateurs et accessoires au même endroit.',
  'home.featuredTitle': 'Vient d’arriver',
  'home.featuredSubtitle': 'Les derniers appareils à prix compétitif, en quantité limitée.',
  'home.newTitle': 'Nouveautés',
  'home.newSubtitle': 'Les dernières références ajoutées au catalogue.',
  'home.viewAll': 'Voir tout',
  'home.statsTitle': 'Pourquoi nous choisir ?',
  'home.statsText':
    "Une boutique algérienne spécialisée dans les smartphones : chaque appareil est sélectionné et testé par nos soins avant l'expédition, puis livré chez vous dans toutes les wilayas, avec paiement à la livraison.",
  'home.statProducts': 'Produits authentiques',
  'home.statWilayas': 'Wilayas couvertes',
  'home.statRating': 'Note moyenne',

  'footer.tagline':
    'La première boutique de smartphones en Algérie. Produits authentiques, prix clairs, livraison à domicile.',
  'footer.quickLinks': 'Liens rapides',
  'footer.categories': 'Catégories',
  'footer.contact': 'Nous contacter',
  'footer.rights': '© 2026 Akrem Mobile — Tous droits réservés',
  'footer.madeIn': 'Fait en Algérie',

  'common.addToCart': 'Ajouter au panier',
  'common.added': 'Ajouté au panier',
  'common.outOfStock': 'Rupture de stock',
  'common.inStock': 'En stock',
  'common.lowStock': 'Stock limité',
  'common.loading': 'Chargement…',
  'common.error': 'Une erreur est survenue, réessayez',
  'common.retry': 'Réessayer',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.add': 'Ajouter',
  'common.close': 'Fermer',
  'common.price': 'Prix',
  'common.quantity': 'Quantité',
  'common.total': 'Total',
  'common.results': 'résultat(s)',
  'common.noResults': 'Aucun produit ne correspond',
  'common.brand': 'Marque',
  'common.rating': 'Note',
  'common.new': 'Nouveau',
  'common.products': 'produits',
  'common.home': 'Accueil',

  'product.specs': 'Caractéristiques',
  'product.related': 'Produits associés',
  'product.description': 'Description',
  'product.qty': 'Quantité',
  'product.inStock': 'En stock',
  'product.soldOut': 'Rupture de stock',
  'product.ram': 'Mémoire vive',
  'product.storage': 'Stockage',
  'product.screen': 'Écran',
  'product.battery': 'Batterie',
  'product.back': 'Retour',

  'cart.title': 'Panier',
  'cart.empty': 'Votre panier est vide',
  'cart.emptyText': 'Ajoutez des produits pour les voir apparaître ici.',
  'cart.continue': 'Continuer mes achats',
  'cart.checkout': 'Commander',
  'cart.remove': 'Supprimer',
  'cart.subtotal': 'Sous-total',
  'cart.delivery': 'Frais de livraison',
  'cart.deliveryAtCheckout': 'Calculés à l’étape de commande',
  'cart.items': 'Articles',
  'cart.clear': 'Vider le panier',

  'checkout.title': 'Commande',
  'checkout.sub': 'Renseignez vos informations, nous vous rappelons pour confirmer.',
  'checkout.name': 'Nom complet',
  'checkout.namePlaceholder': 'Ex. Mohamed Amine Belkacem',
  'checkout.phone': 'Téléphone',
  'checkout.phonePlaceholder': '0555 12 34 56',
  'checkout.wilaya': 'Wilaya',
  'checkout.wilayaPlaceholder': 'Choisissez votre wilaya',
  'checkout.commune': 'Commune',
  'checkout.communePlaceholder': 'Ex. Bir Mourad Raïs',
  'checkout.address': 'Adresse',
  'checkout.addressPlaceholder': 'Quartier, rue, numéro…',
  'checkout.note': 'Remarques',
  'checkout.notePlaceholder': 'Toute information utile pour la livraison',
  'checkout.payment': 'Mode de paiement',
  'checkout.cod': 'Paiement à la livraison (COD)',
  'checkout.submit': 'Confirmer la commande',
  'checkout.placing': 'Enregistrement…',
  'checkout.emptyCart': 'Votre panier est vide, ajoutez un produit d’abord.',
  'checkout.errName': 'Saisissez votre nom complet (3 caractères minimum)',
  'checkout.errPhone': 'Saisissez un numéro algérien valide (0[5-7]…)',
  'checkout.errWilaya': 'Choisissez votre wilaya',
  'checkout.errCommune': 'Saisissez la commune',
  'checkout.errAddress': 'Saisissez une adresse claire',

  'order.successTitle': 'Commande reçue avec succès !',
  'order.successText': 'Nous vous appelons sous 24 h pour confirmer. Conservez la référence pour suivre votre commande.',
  'order.reference': 'Référence',
  'order.items': 'Articles',
  'order.delivery': 'Livraison',
  'order.total': 'Total',
  'order.cod': 'Paiement à la livraison',
  'order.trackCta': 'Suivre ma commande',
  'order.continue': 'Retour à la boutique',

  'track.title': 'Suivre ma commande',
  'track.sub': 'Saisissez la référence reçue après votre commande.',
  'track.placeholder': 'AKR-20260101-AB12',
  'track.submit': 'Suivre',
  'track.notFound': 'Aucune commande avec cette référence',
  'track.status': 'Statut',

  'admin.login': 'Connexion',
  'admin.password': 'Mot de passe',
  'admin.signin': 'Se connecter',
  'admin.dashboard': 'Tableau de bord',
  'admin.orders': 'Commandes',
  'admin.products': 'Produits',
  'admin.logout': 'Déconnexion',
  'admin.statProducts': 'Produits',
  'admin.statOrders': 'Commandes',
  'admin.statRevenue': 'Chiffre d’affaires (hors annulées)',
  'admin.statLowStock': 'Produits stock ≤ 5',
  'admin.customer': 'Client',
  'admin.ref': 'Référence',
  'admin.date': 'Date',
  'admin.wilaya': 'Wilaya',
  'admin.status': 'Statut',
  'admin.actions': 'Actions',
  'admin.newProduct': 'Nouveau produit',
  'admin.editProduct': 'Modifier le produit',
  'admin.deleteConfirm': 'Supprimer ce produit ?',
  'admin.noOrders': 'Aucune commande pour le moment',
  'admin.noProducts': 'Aucun produit',
  'admin.name': 'Nom (arabe)',
  'admin.nameFr': 'Nom (français)',
  'admin.image': 'URL de l’image',
  'admin.featured': 'Produit mis en avant',
  'admin.description': 'Description',
  'admin.invalidToken': 'Veuillez vous reconnecter',
  'admin.loginFailed': 'Mot de passe incorrect',
  'admin.saved': 'Enregistré',
  'admin.deleted': 'Supprimé',
  'admin.searchPlaceholder': 'Rechercher ou saisir…',

  'status.new': 'Nouvelle',
  'status.confirmed': 'Confirmée',
  'status.shipped': 'Expédiée',
  'status.delivered': 'Livrée',
  'status.cancelled': 'Annulée',
}

const DICT: Record<Lang, Record<TKey, string>> = { ar, fr }
const LANG_KEY = 'akrem-lang'
export const WHATSAPP = '213660607788'

type I18nValue = {
  lang: Lang
  dir: 'rtl' | 'ltr'
  t: (key: TKey) => string
  setLang: (lang: Lang) => void
  toggleLang: () => void
  /** Latin-digit DZD with a local suffix: 145 000 دج / 145 000 DA */
  money: (value: number | null | undefined) => string
  productName: (product: Pick<Product, 'name' | 'name_fr'>) => string
  productDescription: (product: Pick<Product, 'description' | 'description_fr'>) => string
  categoryLabel: (category: Category) => string
  statusLabel: (status: OrderStatus) => string
  whatsappLink: (message?: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function initialLang(): Lang {
  if (typeof window === 'undefined') return 'ar'
  const saved = window.localStorage.getItem(LANG_KEY)
  if (saved === 'ar' || saved === 'fr') return saved
  return 'ar' // Arabic is the default brand language
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const dir: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = dir
    try {
      window.localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang, dir])

  const setLang = useCallback((next: Lang) => setLangState(next), [])
  const toggleLang = useCallback(() => setLangState((prev) => (prev === 'ar' ? 'fr' : 'ar')), [])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      dir,
      t: (key) => DICT[lang][key],
      setLang,
      toggleLang,
      money: (amount) => formatDZD(amount, lang),
      productName: (product) => (lang === 'ar' ? product.name : product.name_fr || product.name),
      productDescription: (product) =>
        lang === 'ar' ? product.description : product.description_fr || product.description,
      categoryLabel: (category) => DICT[lang][`cat.${category}` as TKey],
      statusLabel: (status) => DICT[lang][`status.${status}` as TKey],
      whatsappLink: (message) => {
        const text = encodeURIComponent(
          message ||
            (lang === 'ar'
              ? 'مرحباً أكـرم موبايل، أريد الاستفسار عن منتجاتكم'
              : 'Bonjour Akrem Mobile, je souhaite des informations sur vos produits')
        )
        return `https://wa.me/${WHATSAPP}?text=${text}`
      },
    }),
    [lang, dir, setLang, toggleLang]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>')
  return context
}
