import type { StrapiCollectionProduct } from "@lib/data/strapi/collections"
import RelatedProductsSwiper from "./swiper"

// Pre-selected curated products — no API calls needed at runtime.
// A diverse mix of chicken, turkey, lamb, and veal with good images.
const CURATED_PRODUCTS: StrapiCollectionProduct[] = [
  {
    documentId: "h3bag0zmsoqztfq0vqj5n6ry",
    Title: "Kosher Chicken Drumettes & Wingettes",
    FeaturedImage: {
      url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/6_01_12_1_primary_9143d2bfb5.jpg",
    },
    GalleryImages: [
      {
        url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/6_01_12_1_secondary_06bf5cc937.jpg",
      },
    ],
    MedusaProduct: {
      ProductId: "prod_01KC9RFN8D0E194R1KETKZ26CN",
      Handle:
        "chicken-wings-david-elliot-chk-supervision-vacuum-packed-17-lb-kosher-for-passover-328lb",
      Description:
        "Expertly prepared and hand-trimmed, these premium, tender pieces deliver superior flavor and consistent cooking results.",
      Variants: [
        {
          VariantId: "variant_01KC9RFN9Z4M3C2NY23E2X2GY9",
          Sku: "6-01-12-1",
          Price: { CalculatedPriceNumber: 5.58 },
        },
      ],
    },
    Metadata: {
      GlutenFree: true,
      MSG: true,
      Cooked: false,
      Uncooked: true,
      AvgPackWeight: "~1.7 lb.",
      Serves: "3-4",
    },
    Categorization: {
      ProductTags: [
        { Name: "L1: Butcher Counter" },
        { Name: "L2: Chicken" },
        { Name: "L3: Chicken Wings" },
      ],
    },
  },
  {
    documentId: "m6mmvmjvdchmlbke917wlgat",
    Title: "Kosher First Cut Hand-Trimmed Lamb Chops",
    FeaturedImage: {
      url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/3_01_12_1_primary_c58f64bb16.jpg",
    },
    GalleryImages: [
      {
        url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/3_01_12_1_secondary_f6090985d8.jpg",
      },
    ],
    MedusaProduct: {
      ProductId: "prod_01KC9RFAPPJ29C9BJXBMMK9E7S",
      Handle:
        "first-cut-lamb-chops-hand-trimmed-4-chops-uncooked-kosher-for-passover",
      Description:
        "Expertly prepared and hand-trimmed, these premium, tender lamb chops sear quickly for a flavorful crust.",
      Variants: [
        {
          VariantId: "variant_01KC9RFARNGDWGSTBDFW264DCQ",
          Sku: "3-01-12-1",
          Price: { CalculatedPriceNumber: 101.95 },
        },
      ],
    },
    Metadata: {
      GlutenFree: true,
      MSG: true,
      Cooked: false,
      Uncooked: true,
      Serves: "2-3",
      PiecesPerPack: 4,
    },
    Categorization: {
      ProductTags: [
        { Name: "L1: Butcher Counter" },
        { Name: "L2: Lamb" },
        { Name: "L3: Lamb Chops" },
      ],
    },
  },
  {
    documentId: "kasb1pi57tlxgv7mk51i5zae",
    Title: "Kosher Veal Scallopini Cutlets",
    FeaturedImage: {
      url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/2_06_11_1_primary_97690de0ad.jpg",
    },
    GalleryImages: [
      {
        url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/2_06_11_1_secondary_9ac3c9e736.jpg",
      },
    ],
    MedusaProduct: {
      ProductId: "prod_01KC9RF6640Y8R6S0SQPGYSAPP",
      Handle:
        "veal-scallopini-5-8-slices-1-lb-uncooked-kosher-for-passover-3699lb",
      Description:
        "Expertly prepared and hand-trimmed, this premium tender cut is thin-sliced and ready for quick sautéing.",
      Variants: [
        {
          VariantId: "variant_01KC9RF68JJ7PA67ZS67YMV5ZM",
          Sku: "2-06-11-1",
          Price: { CalculatedPriceNumber: 36.99 },
        },
      ],
    },
    Metadata: {
      GlutenFree: true,
      MSG: true,
      Cooked: false,
      Uncooked: true,
      AvgPackWeight: "~1 lb.",
      Serves: "2-3",
      PiecesPerPack: 1,
    },
    Categorization: {
      ProductTags: [
        { Name: "L1: Butcher Counter" },
        { Name: "L2: Veal" },
        { Name: "L3: Veal Cutlets & Schnitzel" },
      ],
    },
  },
  {
    documentId: "gqejyza8r31vldqn82tznfbh",
    Title: "Kosher Cut-Up Chicken, Family Style",
    FeaturedImage: {
      url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/6_61_02_1_primary_e1cb3ef646.jpg",
    },
    GalleryImages: [
      {
        url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/6_61_02_1_secondary_98854ee7d7.jpg",
      },
    ],
    MedusaProduct: {
      ProductId: "prod_01KC9RG85QF6PF3B06GPX5RG43",
      Handle:
        "8-piece-cutup-chicken-antibiotic-free-hormone-free-3-lb-uncooked-kosher-for-passover-vacuum-packed-kosher-for-passover-615lb",
      Description:
        "Expertly prepared and hand-trimmed, this premium portioned bird roasts, grills or braises to tender, juicy results.",
      Variants: [
        {
          VariantId: "variant_01KC9RG879V83NFB87V21V7B7M",
          Sku: "6-61-02-1",
          Price: { CalculatedPriceNumber: 18.45 },
        },
      ],
    },
    Metadata: {
      GlutenFree: true,
      MSG: true,
      Cooked: false,
      Uncooked: true,
      AvgPackWeight: "~3 lb.",
      Serves: "5-6",
      PiecesPerPack: 8,
    },
    Categorization: {
      ProductTags: [
        { Name: "L1: Butcher Counter" },
        { Name: "L2: Chicken" },
        { Name: "L3: Cut-Up Chicken" },
      ],
    },
  },
  {
    documentId: "k9gl2mwvclr0il5iql93yh64",
    Title: "Kosher First Cut Thick Veal Chops",
    FeaturedImage: {
      url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/2_01_12_2_primary_20553f6cfe.jpg",
    },
    GalleryImages: [
      {
        url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/2_01_12_2_secondary_ce83c92d82.jpg",
      },
    ],
    MedusaProduct: {
      ProductId: "prod_01KC9RF3CEJPXH3HKWBED598YF",
      Handle:
        "veal-chops-first-cut-15-thick-beautifully-trimmed-2x15-oz-uncooked-kosher-for-passover-4224lb",
      Description:
        "Expertly prepared and hand-trimmed, this premium veal offers a tender, delicate texture that shines when quickly pan-seared.",
      Variants: [
        {
          VariantId: "variant_01KC9RF3E6JXBCG7DJSFGJ0G21",
          Sku: "2-01-12-2",
          Price: { CalculatedPriceNumber: 79.2 },
        },
      ],
    },
    Metadata: {
      GlutenFree: true,
      MSG: true,
      Cooked: false,
      Uncooked: true,
      AvgPackWeight: "~1.8 lb.",
      Serves: "2",
      PiecesPerPack: 2,
    },
    Categorization: {
      ProductTags: [
        { Name: "L1: Butcher Counter" },
        { Name: "L2: Veal" },
        { Name: "L3: Veal Chops" },
      ],
    },
  },
  {
    documentId: "cvblg9xf189hn6nql4exw9if",
    Title: "Kosher Whole Turkey Drumsticks",
    FeaturedImage: {
      url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/7_60_14_1_primary_081420e87e.jpg",
    },
    GalleryImages: [
      {
        url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/7_60_14_1_secondary_442a859e82.jpg",
      },
    ],
    MedusaProduct: {
      ProductId: "prod_01KC9RGZS4GXHP9160XM1MK8KW",
      Handle:
        "turkey-drumsticks-2-x-1-lb-certified-organic-and-free-range-kosher-for-passover-1017lb",
      Description:
        "Expertly prepared and hand-trimmed for roasting or braising, these bone-in cuts deliver premium, tender, richly flavored meat.",
      Variants: [
        {
          VariantId: "variant_01KC9RGZV3DXE00HDTW304765Z",
          Sku: "7-60-14-1",
          Price: { CalculatedPriceNumber: 20.34 },
        },
      ],
    },
    Metadata: {
      GlutenFree: true,
      MSG: true,
      Cooked: false,
      Uncooked: true,
      AvgPackWeight: "~2 lb.",
      Serves: "1-2",
      PiecesPerPack: 1,
    },
    Categorization: {
      ProductTags: [
        { Name: "L1: Butcher Counter" },
        { Name: "L2: Turkey" },
        { Name: "L3: Turkey Drumsticks" },
      ],
    },
  },
  {
    documentId: "jpr5bjb3o5gi6fg6a7giq9cb",
    Title: "Kosher Ground Dark Turkey Meat",
    FeaturedImage: {
      url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/7_61_15_1_primary_cd2f48c347.jpg",
    },
    GalleryImages: [
      {
        url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/7_61_15_1_secondary_cc73512f41.jpg",
      },
    ],
    MedusaProduct: {
      ProductId: "prod_01KC9RH2JQY5YYFAQ3A4TBX248",
      Handle:
        "ground-turkey-dark-meat-vacuum-packed-antibiotic-free-hormone-free-1-lb-uncooked-not-kosher-for-passover",
      Description:
        "Expertly prepared and hand-trimmed, this premium, tender blend is sealed for peak flavor and ready for quick sautés.",
      Variants: [
        {
          VariantId: "variant_01KC9RH2M80DJBMKEM087SJYHC",
          Sku: "7-61-15-1",
          Price: { CalculatedPriceNumber: 12.3 },
        },
      ],
    },
    Metadata: {
      GlutenFree: true,
      MSG: true,
      Cooked: false,
      Uncooked: true,
      AvgPackWeight: "1 lb.",
      Serves: "3-4",
      PiecesPerPack: 1,
    },
    Categorization: {
      ProductTags: [
        { Name: "L1: Butcher Counter" },
        { Name: "L2: Turkey" },
        { Name: "L3: Ground Turkey" },
      ],
    },
  },
  {
    documentId: "npxsf5ta3hwg4blghut7w95z",
    Title: "Kosher Organic Cut-Up Chicken Cuts",
    FeaturedImage: {
      url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/6_60_02_1_primary_ecce885717.jpg",
    },
    GalleryImages: [
      {
        url: "https://helpful-nature-fab70f9c51.media.strapiapp.com/6_60_02_1_secondary_084be3a301.jpg",
      },
    ],
    MedusaProduct: {
      ProductId: "prod_01KC9RG4K34XCXZ9YJH77J8PJK",
      Handle:
        "organic-chicken-8-piece-cutup-3-lb-uncooked-kosher-for-passover-882lb",
      Description:
        "Expertly prepared and hand-trimmed, these tender, premium portions are ideal for even roasting and quick braising.",
      Variants: [
        {
          VariantId: "variant_01KC9RG4MG5PNFV7WYG506VPGS",
          Sku: "6-60-02-1",
          Price: { CalculatedPriceNumber: 26.46 },
        },
      ],
    },
    Metadata: {
      GlutenFree: true,
      MSG: true,
      Cooked: false,
      Uncooked: true,
      AvgPackWeight: "~3 lb.",
      Serves: "5-6",
      PiecesPerPack: 8,
    },
    Categorization: {
      ProductTags: [
        { Name: "L1: Butcher Counter" },
        { Name: "L2: Chicken" },
        { Name: "L3: Cut-Up Chicken" },
      ],
    },
  },
]

type RelatedProductsProps = {
  product: { id: string }
  countryCode: string
}

export default function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  // Filter out the current product if it happens to be one of the curated 8
  const products = CURATED_PRODUCTS.filter(
    (p) => p.MedusaProduct?.ProductId !== product.id
  )

  if (!products.length) return null

  return (
    <RelatedProductsSwiper products={products} countryCode={countryCode} />
  )
}
