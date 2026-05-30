#!/usr/bin/env node

import fs from "node:fs"

const STRAPI_ENDPOINT = process.env.STRAPI_ENDPOINT?.replace(/\/+$/, "")
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN
const ADMIN_JWT_CACHE = "/tmp/strapi_admin_jwt.txt"
const APPLY = process.argv.includes("--apply")

const PATCHES = [
  {
    documentId: "idns63slg2g738x337p3a5z9",
    fields: {
      "MedusaProduct.Description":
        "Veal chops, two 15 oz pieces, the substantial size for serious eaters. Sear hard in a hot pan with olive oil and herbs, finish in the oven if needed to medium, rest, serve. The bone in the center keeps the meat moist throughout. Kosher for Passover.",
    },
  },
  {
    documentId: "cx4r3oiuqpcgj9gpholiknje",
    fields: {
      "MedusaProduct.Description":
        "First cut veal chops, hand-trimmed and cut to a serious one-inch thickness, two 10.5 oz portions. Sear hard in olive oil with sage and a smashed garlic clove, finish in the oven to 145 F internal for a rosy medium, rest, serve with a wedge of lemon. Kosher for Passover.",
    },
  },
  {
    documentId: "k9gl2mwvclr0il5iql93yh64",
    fields: {
      "MedusaProduct.Description":
        "First cut veal chops cut to a dramatic one-and-a-half-inch thickness, two 15 oz portions. The thick cut means a deep crust before the interior approaches the target temperature. Sear hard, spoon hot pan juices with thyme, finish in a 400 F oven to 145 F internal for medium. Rest, serve. Kosher for Passover.",
    },
  },
  {
    documentId: "c5rs2s6db8xvqy16z85xj8or",
    fields: {
      "MedusaProduct.Description":
        "Ground veal in a one-pound pack. Use as the lighter component of a kosher meatball mix with ground beef, ground lamb, herbs, and aromatics, or build a tomato-rich Bolognese-style sauce with vegetables, stock, and certified kosher wine if desired. The veal's mild flavor brings tenderness without competing with bold seasoning.",
    },
  },
  {
    documentId: "kasb1pi57tlxgv7mk51i5zae",
    fields: {
      "MedusaProduct.Description":
        "Veal scallopini, pounded thin for fast cooking. Five to eight slices per one-pound pack. Dredge lightly in potato starch, sear thirty seconds per side in hot olive oil, finish with lemon, capers, and stock for veal piccata-style, or top with sage and crisp beef fry for saltimbocca-style. Kosher for Passover.",
    },
  },
  {
    documentId: "ux4dcjutj9cqfli39ilf8y5r",
    fields: {
      "MedusaProduct.Description":
        "Ground lamb in a one-pound vacuum pack. Build kefta or kofta meatballs with cumin, coriander, and parsley, or shape into burgers and finish with cucumber, herbs, and lemon-tahini sauce. The lamb's bigger flavor stands up to bold seasoning.",
    },
  },
  {
    documentId: "langmthcjijft6jnh1l9x64m",
    fields: {
      "MedusaProduct.Description":
        "Four chicken kebabs on skewers, pre-marinated in a hot and spicy seasoning. Each skewer about 5 ounces. Grill over hot coals for char, or broil 4 inches under high heat, turning once. Serve over rice with a cooling cucumber-tahini sauce.",
    },
  },
  {
    documentId: "d3tabvbfh5tg0p1b0drwrfs9",
    fields: {
      "MedusaProduct.Description":
        "Thinly sliced chicken cutlets from antibiotic-free birds, pre-pounded to schnitzel thinness. Two 3.5 oz portions per pack. Coat with certified Kosher for Passover matzo meal or potato starch, pan-fry until golden, finish with a squeeze of lemon. Kosher for Passover.",
    },
  },
  {
    documentId: "ya5m54l8y8nbnymdya2z1b31",
    fields: {
      "MedusaProduct.Description":
        "Turkey chops cut from AGRISTAR turkey, five 3.5 oz portions ready for the skillet. Sear hard in olive oil with sage, finish with a splash of stock and a squeeze of lemon. Faster than chicken cutlets, with deeper flavor. Kosher for Passover.",
    },
  },
  {
    documentId: "uo7hn2ljhgv7smov6ow2d646",
    fields: {
      "MedusaProduct.Description":
        "Shredded mozzarella from Haolam under cholov Yisroel supervision, 2 lb pack. The everyday melting cheese for matzo pizza, Passover vegetable bakes, and dairy casseroles. Kosher for Passover.",
      "MedusaProduct.ShortDescription":
        "Haolam cholov Yisroel shredded mozzarella, 2 lb pack. The matzo-pizza and Passover vegetable-bake mozzarella at family scale.",
    },
  },
  {
    documentId: "v9osup42hoa6gqiudnous9b7",
    fields: {
      "MedusaProduct.Description":
        "Boneless chicken cutlets pounded to schnitzel thinness for fast, even cooking. Two 5 oz portions in a pack. Dredge in potato starch, egg, and certified Kosher for Passover matzo meal, then pan-fry in shallow oil for about three minutes per side. Serve with lemon. Kosher for Passover.",
    },
  },
  {
    documentId: "jru1v8qle4usghwmf4ui49xn",
    fields: {
      "MedusaProduct.Description":
        "Boneless turkey breast cutlets from AGRISTAR, four pieces at roughly 10 oz each. The leanest meat in the case, ready to coat for schnitzel, sear hard with olive oil and herbs, or grill with a citrus marinade. Kosher for Passover.",
    },
  },
  {
    documentId: "qjh3hhef4yzwnu56bs4i10z2",
    fields: {
      "MedusaProduct.Description":
        "First cut brisket cured and smoked into pastrami in-house, hand-sliced thin, and vacuum-packed at 8 oz. Pile on rye with deli mustard for the classic sandwich, serve with sauerkraut and dairy-free Russian-style dressing, or warm gently in the slicing liquid. Fully cooked, ready to eat.",
    },
  },
  {
    documentId: "zih8zs0x7uakbhhh64ex2090",
    fields: {
      "MedusaProduct.Description":
        "First cut corned beef cooked in-house, hand-sliced thin, and vacuum-packed at 8 oz. Pile on rye with deli mustard, serve with sauerkraut and dairy-free Russian-style dressing, or warm gently in the slicing liquid. Fully cooked, ready to eat.",
    },
  },
  {
    documentId: "m59pmwg5rf7ljrlp7rckedq9",
    fields: {
      "MedusaProduct.Description":
        "An American Angus strip cut in the Denver style, taken from the chuck shoulder where marbling runs heavy. A single 11 oz boneless portion that drinks up a marinade and rewards a hot cast-iron sear. Spoon hot pan juices over it in the final minute, then slice across the grain. Kosher for Passover.",
    },
  },
  {
    documentId: "n1b921u9w4d5h2vgbqzuf1ge",
    fields: {
      "MedusaProduct.Description":
        "A boneless ribeye sourced from South America, cut a full 1 inch thick to 12 to 16 ounces of meat. Big enough to slice across two plates, well-priced enough for a weeknight. Sear hot in cast-iron with olive oil, garlic, and thyme, and rest a few minutes before slicing. Kosher for Passover.",
    },
  },
  {
    documentId: "m5byk4pqzyqyoe6m5dkbnayv",
    fields: {
      "MedusaProduct.Description":
        "Boneless ribeye from Black Angus, the premium Angus line known for tight grain and exceptional marbling. Hand-cut to 1 inch thick at a single-serving 11 to 13 ounces. Sear over high heat, spoon hot pan juices over it in the final minute, rest, then slice. Kosher for Passover.",
    },
  },
  {
    documentId: "yibzsnw1rv5867jy5t0iibja",
    fields: {
      "MedusaProduct.Description":
        "Steak tips cut from the tender French roast, perfect for fast-cook applications. Sear hard in a cast-iron pan with olive oil and herbs, or skewer for the grill. The shoulder origin gives more flavor than the standard sirloin tip. Roughly one pound. Kosher for Passover.",
    },
  },
  {
    documentId: "csh4mkaiuo1ci7e22hr305tr",
    fields: {
      "MedusaProduct.Description":
        "A pair of American Angus petite filet steaks, each 5 ounces. Cut from the loin, these portions share the tender character that makes filet special, with Angus marbling for added flavor. Sear hot in cast-iron, spoon hot pan juices over the steaks in the final minute, rest, and serve. Kosher for Passover.",
    },
  },
  {
    documentId: "q1ba423iawsu78ftlqfguzgq",
    fields: {
      "MedusaProduct.Description":
        "The Teres Major, also called Supreme Tender, is the second-most-tender muscle in the cow after the tenderloin and a fraction of the price. Cut from the shoulder, this boneless portion is roughly 10 ounces with a clean grain. Sear hot in cast-iron with olive oil and herbs, then slice thin across the grain. Kosher for Passover.",
    },
  },
  {
    documentId: "cxb8q9wig213jeo3m89303eb",
    fields: {
      "MedusaProduct.Description":
        "Beef sweetbreads (the thymus gland) from American Angus cattle, the most prized of the offal cuts. Soak overnight in cold water, blanch, peel the membrane, then sear hard in olive oil until crisp for a French-inspired preparation with lemon and capers. One pound. Kosher for Passover.",
    },
  },
  {
    documentId: "h0135kb3d27l08zsx3tffan3",
    fields: {
      "MedusaProduct.Description":
        "Gefen solid white tuna (albacore) packed in water at 6 oz. The premium grade: solid pieces hold their shape in tuna salad and break into satisfying flakes for nicoise-style plates or potato salad. Drain well before using. Kosher for Passover.",
      "MedusaProduct.ShortDescription":
        "Gefen solid white tuna packed in water, 6 oz can. The premium tuna grade for tuna salad and potato salad.",
    },
  },
  {
    documentId: "ip3onlakevd6258eqkmvc64m",
    fields: {
      "MedusaProduct.Description":
        "Gefen chunk light tuna packed in water at 6 oz. The everyday tuna grade, smaller pieces than solid white but lower in cost and just as versatile. Drain, mix with mayo and onion for tuna salad, or fold into a quick potato salad with garlic and herbs. Kosher for Passover.",
      "MedusaProduct.ShortDescription":
        "Gefen chunk light tuna in water, 6 oz can. The everyday tuna for salad and quick potato salads.",
    },
  },
  {
    documentId: "aqv57krdtcj1d5u87fxmymv1",
    fields: {
      "MedusaProduct.Description":
        "Boneless chuckeye sourced from South America, often called Delmonico for its ribeye-adjacent flavor at a friendlier price. A single 8 oz portion, hand-cut and ready for a hot pan. Sear hard in a cast-iron pan with olive oil, rest, then slice across the grain. Kosher for Passover.",
    },
  },
  {
    documentId: "ad8femdypyn3l1nq1zxp30y9",
    fields: {
      "MedusaProduct.Description":
        "Veal schnitzel, four 4 oz portions pounded thin and ready for the coating station. Dredge in seasoned potato starch, then egg, then certified Kosher for Passover matzo meal. Pan-fry in oil until golden, two minutes per side. Serve with lemon and cucumber salad. Kosher for Passover.",
    },
  },
]

if (!STRAPI_ENDPOINT || !STRAPI_API_TOKEN) {
  throw new Error("Missing STRAPI_ENDPOINT or STRAPI_API_TOKEN")
}

function getAdminJwt() {
  if (process.env.STRAPI_ADMIN_JWT) return process.env.STRAPI_ADMIN_JWT
  if (fs.existsSync(ADMIN_JWT_CACHE)) {
    return fs.readFileSync(ADMIN_JWT_CACHE, "utf8").trim()
  }
  throw new Error(`Missing STRAPI_ADMIN_JWT and ${ADMIN_JWT_CACHE}`)
}

function stripIds(value) {
  if (Array.isArray(value)) return value.map(stripIds)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "id")
        .map(([key, nested]) => [key, stripIds(nested)])
    )
  }
  return value
}

function setDotted(target, path, value) {
  const parts = path.split(".")
  let current = target
  for (const part of parts.slice(0, -1)) {
    current[part] ||= {}
    current = current[part]
  }
  current[parts.at(-1)] = value
}

async function adminJson(path, options = {}) {
  const response = await fetch(`${STRAPI_ENDPOINT}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${getAdminJwt()}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`)
  }
  return text ? JSON.parse(text) : null
}

async function publicProduct(documentId) {
  const response = await fetch(
    `${STRAPI_ENDPOINT}/api/products/${documentId}?populate[MedusaProduct][populate]=*`,
    { headers: { authorization: `Bearer ${STRAPI_API_TOKEN}` } }
  )
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`)
  }
  return JSON.parse(text).data
}

async function remediate(patch) {
  const entry = (
    await adminJson(
      `/content-manager/collection-types/api::product.product/${patch.documentId}`
    )
  ).data

  const body = {}
  if (Object.keys(patch.fields).some((field) => field.startsWith("MedusaProduct."))) {
    body.MedusaProduct = stripIds(entry.MedusaProduct || {})
  }
  if (Object.keys(patch.fields).some((field) => field.startsWith("SEO."))) {
    body.SEO = stripIds(entry.SEO || {})
  }
  if (Object.keys(patch.fields).some((field) => field.startsWith("SocialMeta."))) {
    body.SocialMeta = stripIds(entry.SocialMeta || {})
  }

  for (const [field, value] of Object.entries(patch.fields)) {
    setDotted(body, field, value)
  }

  if (!APPLY) {
    return { documentId: patch.documentId, title: entry.Title, mode: "dry-run" }
  }

  await adminJson(
    `/content-manager/collection-types/api::product.product/${patch.documentId}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  )
  await adminJson(
    `/content-manager/collection-types/api::product.product/${patch.documentId}/actions/publish`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  )

  const updated = await publicProduct(patch.documentId)
  for (const [field, value] of Object.entries(patch.fields)) {
    const actual = field
      .split(".")
      .reduce((current, part) => current?.[part], updated)
    if (actual !== value) {
      throw new Error(
        `Readback mismatch for ${patch.documentId} ${field}: expected "${value}", got "${actual}"`
      )
    }
  }

  return { documentId: patch.documentId, title: updated.Title, mode: "applied" }
}

const results = []
const failures = []

for (const patch of PATCHES) {
  try {
    const result = await remediate(patch)
    results.push(result)
    console.log(`${result.mode}: ${result.title}`)
  } catch (error) {
    failures.push({ documentId: patch.documentId, error: error.message })
    console.error(`failed: ${patch.documentId}: ${error.message}`)
  }
}

const summary = {
  mode: APPLY ? "apply" : "dry-run",
  patched: results.length,
  failures,
}

console.log(JSON.stringify(summary, null, 2))
if (failures.length) process.exitCode = 1
