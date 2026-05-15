export type LearnArticleCategory =
  | "Kosher Meat 101"
  | "Cut Library"
  | "Cooking & Buying Guides"

export type LearnArticleLink = {
  label: string
  href: string
  event?: string
}

export type LearnArticleTable = {
  columns: string[]
  rows: string[][]
}

export type LearnArticleSection = {
  id: string
  heading: string
  body?: string[]
  bullets?: string[]
  table?: LearnArticleTable
  callout?: string
}

export type LearnArticleFaq = {
  question: string
  answer: string
}

export type LearnArticle = {
  slug: string
  category: LearnArticleCategory
  title: string
  metaTitle: string
  description: string
  updated: string
  readTime: string
  heroImage: string
  heroAlt: string
  quickAnswer: string
  facts: { label: string; value: string }[]
  sections: LearnArticleSection[]
  faqs: LearnArticleFaq[]
  primaryCta?: LearnArticleLink
  secondaryCta?: LearnArticleLink
  related: LearnArticleLink[]
  sources?: LearnArticleLink[]
}

const assets = {
  butcher:
    "https://helpful-nature-fab70f9c51.media.strapiapp.com/howitworks_card_1_40c3310173.jpg",
  order:
    "https://helpful-nature-fab70f9c51.media.strapiapp.com/howitworks_order_fa3561917c.jpg",
  coldPack:
    "https://helpful-nature-fab70f9c51.media.strapiapp.com/howitworks_card_2_75728aa519.jpg",
  beef: "https://helpful-nature-fab70f9c51.media.strapiapp.com/1_01_32_3_primary_5ab9386222.jpg",
  lamb: "https://helpful-nature-fab70f9c51.media.strapiapp.com/3_01_12_1_primary_c58f64bb16.jpg",
  poultry:
    "https://helpful-nature-fab70f9c51.media.strapiapp.com/6_61_02_1_primary_e1cb3ef646.jpg",
  veal: "https://helpful-nature-fab70f9c51.media.strapiapp.com/slow_braised_veal_with_onions_and_carrots_2_01_12_1_d860ac0006.jpg",
}

const foodSafetySources: LearnArticleLink[] = [
  {
    label: "USDA FSIS: The Big Thaw",
    href: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/big-thaw-safe-defrosting-methods",
  },
  {
    label: "USDA FSIS: Safe Minimum Internal Temperature Chart",
    href: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart",
  },
]

export const learnArticles: LearnArticle[] = [
  {
    slug: "kosher-meat-101",
    category: "Kosher Meat 101",
    title: "Kosher Meat 101: How to Read the Counter Before You Buy",
    metaTitle: "Kosher Meat 101 | Grillers Pride Butcher Guide",
    description:
      "A practical guide to kosher meat labels, raw versus prepared products, Passover status, supervision, and meat-compatible cooking language.",
    updated: "May 15, 2026",
    readTime: "7 min read",
    heroImage: assets.butcher,
    heroAlt:
      "Grillers Pride team preparing kosher meat in the Doraville facility.",
    quickAnswer:
      "Start with the product itself. Identify whether it is raw or prepared, check the year-round kosher and Passover language, note the certifying agency, then choose a cooking method that fits meat and the cut.",
    facts: [
      { label: "Best for", value: "New customers and careful repeat buyers" },
      {
        label: "Main decision",
        value: "Raw cut, prepared item, or specialty product",
      },
      {
        label: "Kashrut note",
        value: "Use product labels for item-level status",
      },
    ],
    sections: [
      {
        id: "product-page",
        heading: "Start with the product page",
        body: [
          "The product page should answer the first four questions before anyone has to call: what the item is, whether it is raw or prepared, how it is packed, and what kosher or Passover details apply.",
          "For a raw single-ingredient cut, the main shopping questions are usually cut, weight, fat, cooking method, and occasion. For a prepared item, the ingredient list matters more because seasoning, sauces, fillings, casings, and processing steps can change the answer for a specific household.",
        ],
        bullets: [
          "Look for the cut name and package size first.",
          "Confirm whether the item is raw, cooked, smoked, cured, or ready to heat.",
          "Read the Passover language separately from year-round kosher language.",
          "Use the listed hechsher or product label for the item-level answer.",
        ],
      },
      {
        id: "raw-vs-prepared",
        heading: "Why raw single-ingredient cuts are simpler",
        body: [
          "Raw beef, lamb, veal, and poultry cuts are usually easier to evaluate because there are fewer inputs. A brisket, lamb shoulder, chicken thigh, or veal chop is mostly a question of source, supervision, cut, weight, and handling.",
          "Prepared products need more reading. Sausages, biltong, droewors, smoked meats, corned brisket, pocket pies, sides, marinades, and sauces can involve added ingredients and different equipment steps. They can still be fully kosher, but the shopper needs more product-specific detail.",
        ],
        table: {
          columns: ["Product type", "What to check", "Typical buyer question"],
          rows: [
            [
              "Raw cut",
              "Cut, weight, source, hechsher, KFP status",
              "How do I cook this without drying it out?",
            ],
            [
              "Prepared meat",
              "Ingredients, casing, seasoning, hechsher, KFP status",
              "Does this fit my household standard?",
            ],
            [
              "Specialty item",
              "Process, ingredients, serving style, storage",
              "Is this a snack, appetizer, or main dish?",
            ],
          ],
        },
      },
      {
        id: "meat-compatible",
        heading: "Meat guidance has to stay meat-compatible",
        body: [
          "A meat product guide should never suggest dairy ingredients, dairy sauces, dairy finishing steps, or dairy pairings. For Grillers Pride content, that means cooking advice should use oil, schmaltz, stock, wine, herbs, spices, onions, garlic, citrus, pareve sauces, and meat-compatible techniques.",
          "The same standard applies to recipe links, product descriptions, and article content. If a cooking method commonly uses butter or cream in a non-kosher context, the kosher-safe version should name a pareve or meat-compatible alternative instead.",
        ],
        bullets: [
          "Use olive oil, avocado oil, schmaltz, or rendered beef fat for searing.",
          "Use stock, wine, tomatoes, onions, herbs, and spices for braises.",
          "Use pareve sauces and condiments when recommending a pairing.",
          "Do not suggest butter basting, cream sauces, cheese toppings, or dairy sides for meat.",
        ],
      },
      {
        id: "label-enough",
        heading: "When the label is enough and when it is not",
        body: [
          "Most shopping decisions can be handled by a clear product page and label. A customer choosing between brisket cuts, lamb chops, chicken thighs, or stew meat should not need a call just to understand the cut.",
          "A call is still appropriate for a very specific family standard, a time-sensitive Passover question, a substitution on an order, or a question that depends on a product lot. The goal of the guide is to reduce routine calls, not hide the path to a human answer when the details matter.",
        ],
        callout:
          "Kashrut claims should be reviewed by Grillers Pride leadership and the appropriate kashrut authority before publication. This guide is customer education, not a replacement for item-level certification.",
      },
    ],
    faqs: [
      {
        question:
          "Does kosher for year-round use always mean kosher for Passover?",
        answer:
          "No. Passover status is separate. A product can be kosher year-round and still need separate Passover certification or handling.",
      },
      {
        question: "Why are prepared products harder to evaluate than raw cuts?",
        answer:
          "Prepared products can include spices, sauces, casings, fillings, curing steps, or cooked components. Those details matter for item-level kosher and Passover status.",
      },
      {
        question: "What should I do if I only need cooking advice?",
        answer:
          "Use the cut library and cooking guides first. They are designed to answer portion size, method, substitution, and timing questions before you need to call.",
      },
    ],
    primaryCta: {
      label: "Explore the cut library",
      href: "/learn/cuts/beef",
      event: "view_cut_guide",
    },
    secondaryCta: {
      label: "Read supervision details",
      href: "/kashruth/supervision",
      event: "view_kashruth_guide",
    },
    related: [
      { label: "Beef cut guide", href: "/learn/cuts/beef" },
      {
        label: "Frozen delivery and thawing",
        href: "/learn/guides/thawing-frozen-kosher-meat",
      },
      {
        label: "Build a Shabbos meat order",
        href: "/learn/guides/shabbos-meat-order",
      },
    ],
  },
  {
    slug: "cuts/beef",
    category: "Cut Library",
    title: "Kosher Beef Cut Guide",
    metaTitle: "Kosher Beef Cut Guide | Brisket, Deckel, Flanken, Steaks",
    description:
      "Learn the major kosher beef cuts, including brisket, deckel, flanken, London broil, skirt, hanger, oyster steak, cheek, bones, and ground beef.",
    updated: "May 15, 2026",
    readTime: "8 min read",
    heroImage: assets.beef,
    heroAlt: "Raw kosher beef cuts in retail packaging.",
    quickAnswer:
      "Choose beef by job. Brisket, deckel, cheek, ribs, and flanken reward low heat. London broil, skirt, hanger, oyster steak, and burgers need hotter, faster cooking with careful slicing or handling.",
    facts: [
      { label: "Best for", value: "Holiday mains, braises, steaks, cholent" },
      { label: "Most forgiving", value: "Brisket, deckel, flanken, stew meat" },
      { label: "Needs precision", value: "Lean steaks and thin grill cuts" },
    ],
    sections: [
      {
        id: "map",
        heading: "The practical beef map",
        body: [
          "Customers usually do not need a full anatomy lesson. They need to know whether a cut is built for time, heat, slicing, or grinding.",
          "Hard-working muscles tend to have more connective tissue and deeper flavor. They become tender with time, moisture, and steady heat. Leaner cuts can be excellent, but they need a shorter cook and a clean slicing plan.",
        ],
        table: {
          columns: ["Cut family", "Texture", "Best method"],
          rows: [
            [
              "Brisket and deckel",
              "Rich, sliceable, collagen-rich",
              "Low braise or covered roast",
            ],
            [
              "Flanken and short ribs",
              "Fatty, bone-in, deeply savory",
              "Braise, grill, or cholent",
            ],
            [
              "London broil",
              "Lean and firm",
              "Hot sear or broil, then thin slicing",
            ],
            [
              "Skirt and hanger",
              "Loose grain, bold flavor",
              "Quick high heat and slicing across the grain",
            ],
            [
              "Cheek and stew meat",
              "Gelatin-rich and dense",
              "Slow braise or stew",
            ],
            [
              "Ground beef",
              "Flexible and fast",
              "Burgers, meatballs, sauces, stuffed vegetables",
            ],
          ],
        },
      },
      {
        id: "brisket",
        heading: "Brisket, deckel, and whole brisket",
        body: [
          "Brisket is the anchor cut for many kosher kitchens because it feeds a table, reheats well, and rewards advance cooking. First cut is leaner and easier to slice neatly. Deckel is richer, softer, and more forgiving. Whole brisket gives you both personalities in one cook.",
          "The mistake is treating every brisket like the same cut. A lean first cut needs moisture and protection. Deckel can handle more time and gives a softer, more luxurious bite. Whole brisket is best when you want a centerpiece and leftovers.",
        ],
        bullets: [
          "Choose first cut for neat slices and a leaner plate.",
          "Choose deckel for richer texture and more forgiving cooking.",
          "Choose whole brisket for holidays, large tables, and leftovers.",
          "Cook ahead, chill, slice cold, then rewarm gently in sauce or cooking juices.",
        ],
      },
      {
        id: "grill-cuts",
        heading: "Steaks and grill cuts",
        body: [
          "Kosher steaks can be thick, flavorful, and excellent, but not every steak behaves like a supermarket ribeye. Lean cuts such as London broil need a hard sear, a rest, and thin slicing. Loose-grained cuts such as skirt and hanger carry big flavor but can turn chewy if sliced with the grain.",
          "Use meat-compatible fats for the pan, keep the seasoning simple, and let the cut tell you how long it wants. The leaner the cut, the less forgiveness you have after medium.",
        ],
        callout:
          "For meat meals, finish steaks with pan juices, herbs, garlic, stock, wine, or a pareve sauce. Do not use butter basting.",
      },
      {
        id: "bones",
        heading: "Bones, cheeks, and the flavor builders",
        body: [
          "Soup bones, marrow bones, cheek meat, and flanken are the quiet workhorses of the freezer. They turn a simple soup, cholent, tomato sauce, or braise into something that tastes built rather than assembled.",
          "These are also strong education opportunities because customers often skip them when they do not know what they are for. The answer is simple: buy them when you want body, richness, and a dish that improves overnight.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the easiest kosher beef cut for a beginner?",
        answer:
          "For a large meal, brisket or deckel is the safest choice. For a weeknight meal, ground beef or stew meat is easier than a lean steak.",
      },
      {
        question: "Why did my London broil turn tough?",
        answer:
          "It is lean and firm. Cook it hot, avoid overcooking, rest it, and slice it very thin across the grain.",
      },
      {
        question: "What beef cut should I buy for cholent?",
        answer:
          "Flanken, stew meat, cheek meat, bones, and deckel are all strong choices because they can handle long, moist heat.",
      },
    ],
    primaryCta: {
      label: "Shop kosher beef",
      href: "/collections/kosher-beef",
      event: "learn_collection_click",
    },
    secondaryCta: {
      label: "Compare brisket cuts",
      href: "/learn/guides/brisket-first-cut-deckel-whole",
      event: "view_cut_guide",
    },
    related: [
      {
        label: "Brisket first cut, deckel, or whole",
        href: "/learn/guides/brisket-first-cut-deckel-whole",
      },
      {
        label: "Best cuts for slow cooking",
        href: "/learn/guides/best-cuts-for-slow-cooking",
      },
      {
        label: "Best cuts for grilling",
        href: "/learn/guides/best-cuts-for-grilling",
      },
    ],
  },
  {
    slug: "cuts/lamb",
    category: "Cut Library",
    title: "Kosher Lamb Cut Guide",
    metaTitle: "Kosher Lamb Cut Guide | Rack, Chops, Shoulder, Shanks",
    description:
      "Learn how to choose kosher lamb rack, chops, shoulder, shanks, ground lamb, riblets, and lollipop cuts for holidays and weeknight meals.",
    updated: "May 15, 2026",
    readTime: "6 min read",
    heroImage: assets.lamb,
    heroAlt: "Raw kosher lamb chops arranged for sale.",
    quickAnswer:
      "Use lamb rack and chops for fast centerpiece cooking, shoulder and shanks for slow meals, and ground lamb when you want lamb flavor without a formal carving moment.",
    facts: [
      { label: "Best for", value: "Yom Tov, small special dinners, braises" },
      { label: "Fast cuts", value: "Rack, chops, lollipop chops" },
      { label: "Slow cuts", value: "Shoulder, shanks, riblets" },
    ],
    sections: [
      {
        id: "choose",
        heading: "How to choose lamb without guessing",
        body: [
          "Lamb is often treated as intimidating because customers see a premium price and worry about cooking it wrong. The way through is to choose by occasion and cooking window.",
          "Rack, chops, and lollipop cuts are presentation cuts. They cook quickly, look impressive, and need attention. Shoulder and shanks are comfort cuts. They want time, aromatics, and moisture.",
        ],
        table: {
          columns: ["Cut", "What it feels like", "Best use"],
          rows: [
            ["Rack", "Tender and showy", "Holiday centerpiece"],
            ["Chops", "Quick and portioned", "Weeknight premium dinner"],
            ["Shoulder", "Rich and forgiving", "Pulled lamb, braise, stew"],
            ["Shanks", "Gelatin-rich and dramatic", "Slow braise"],
            [
              "Ground lamb",
              "Flexible and deeply flavored",
              "Kebabs, meatballs, stuffed vegetables",
            ],
          ],
        },
      },
      {
        id: "rack",
        heading: "Rack, chops, and lollipop cuts",
        body: [
          "Rack of lamb is prized because it combines tenderness, visual impact, and easy portioning. Chops and lollipop cuts make that same experience more modular. They are best when the table wants a premium main without a long braise.",
          "The mistake is overcooking. These cuts do not need hours. Use a hot pan, oven finish, grill, or broiler. Rest before serving and keep the seasoning focused.",
        ],
      },
      {
        id: "slow",
        heading: "Shoulder, shanks, and riblets",
        body: [
          "Shoulder and shanks are for cooks who want depth. They need low heat and time, but they give back tenderness, sauce body, and a meal that can be made ahead.",
          "Lamb riblets are smaller and more casual. They work well when you want lamb flavor in a format that feels less formal than a rack.",
        ],
        bullets: [
          "Use shoulder when you want shreddable meat or a rustic roast.",
          "Use shanks when you want individual portions with a rich sauce.",
          "Use riblets for a smaller plate, appetizer, or casual meal.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is lamb hard to cook?",
        answer:
          "No, but the cut matters. Chops and rack cook quickly. Shoulder and shanks are easier if you have time because slow cooking gives more forgiveness.",
      },
      {
        question: "What lamb cut is best for a holiday table?",
        answer:
          "Rack is the showpiece. Shoulder or shanks are better if you want to cook ahead and serve a saucy, tender main.",
      },
    ],
    primaryCta: {
      label: "Shop kosher lamb",
      href: "/collections/kosher-lamb",
      event: "learn_collection_click",
    },
    related: [
      {
        label: "Best cuts for grilling",
        href: "/learn/guides/best-cuts-for-grilling",
      },
      {
        label: "How much meat should I buy",
        href: "/learn/guides/how-much-meat-per-person",
      },
      {
        label: "Build a Shabbos meat order",
        href: "/learn/guides/shabbos-meat-order",
      },
    ],
  },
  {
    slug: "cuts/poultry",
    category: "Cut Library",
    title: "Kosher Poultry Cut Guide",
    metaTitle: "Kosher Poultry Guide | Chicken, Turkey, Duck, Capon",
    description:
      "Learn how to choose whole chicken, cut-up chicken, cutlets, thighs, wings, drumsticks, turkey, duck, and capon for kosher meals.",
    updated: "May 15, 2026",
    readTime: "6 min read",
    heroImage: assets.poultry,
    heroAlt: "Raw kosher poultry portions in clear retail packaging.",
    quickAnswer:
      "Choose white meat for quick, lean cooking, dark meat for moisture and reheating, whole birds for table presence, and wings or drumsticks for casual trays.",
    facts: [
      {
        label: "Best for",
        value: "Shabbos trays, schnitzel, soup, roast chicken",
      },
      { label: "Most forgiving", value: "Thighs, drumsticks, whole chicken" },
      { label: "Needs care", value: "Cutlets and lean turkey breast" },
    ],
    sections: [
      {
        id: "parts",
        heading: "Chicken parts, explained by use",
        body: [
          "Poultry feels familiar, but the wrong cut still creates a dry tray or a weak soup. The basic split is white meat for speed and dark meat for forgiveness.",
          "Cutlets are excellent for schnitzel and quick dinners, but they overcook fast. Thighs, drumsticks, and whole legs are better when a tray needs to hold, reheat, or feed a mixed table.",
        ],
        table: {
          columns: ["Cut", "Strength", "Best use"],
          rows: [
            ["Cutlets", "Lean and fast", "Schnitzel, stir fry, quick saute"],
            [
              "Thighs",
              "Moist and forgiving",
              "Sheet pans, braises, Shabbos trays",
            ],
            [
              "Wings",
              "Small, rich, casual",
              "Appetizers, grill, sticky sauces",
            ],
            [
              "Drumsticks",
              "Kid-friendly and sturdy",
              "Roasts, trays, packed meals",
            ],
            [
              "Whole chicken",
              "Balanced and economical",
              "Roast chicken, soup, family dinner",
            ],
          ],
        },
      },
      {
        id: "whole",
        heading: "Whole chicken versus 8-piece cut-up",
        body: [
          "A whole chicken gives you the best table presence and the most flexibility if you are comfortable carving. An 8-piece cut-up chicken makes serving simpler and lets each piece cook with more exposed surface.",
          "For soup, whole birds, bones, backs, and dark meat give better body. For schnitzel, cutlets are the right tool. For a reheatable Shabbos tray, dark meat is usually safer than breast meat.",
        ],
      },
      {
        id: "specialty",
        heading: "Turkey, duck, and capon",
        body: [
          "Turkey is best when you need scale or a holiday alternative to beef. Duck is richer and more assertive, with more fat and a different texture. Capon is a premium poultry option for customers who want a larger, tender bird.",
          "These specialty birds need clear planning because package size, thawing time, and serving expectations matter more than they do for everyday chicken parts.",
        ],
      },
    ],
    faqs: [
      {
        question: "What poultry cut reheats best?",
        answer:
          "Dark meat, especially thighs and drumsticks, usually reheats better than lean cutlets.",
      },
      {
        question: "What should I buy for schnitzel?",
        answer:
          "Chicken cutlets are the standard choice. Keep them thin and cook quickly so they stay tender.",
      },
    ],
    primaryCta: {
      label: "Shop kosher chicken",
      href: "/collections/kosher-chicken",
      event: "learn_collection_click",
    },
    related: [
      {
        label: "Build a Shabbos meat order",
        href: "/learn/guides/shabbos-meat-order",
      },
      {
        label: "Frozen delivery and thawing",
        href: "/learn/guides/thawing-frozen-kosher-meat",
      },
      {
        label: "How much meat should I buy",
        href: "/learn/guides/how-much-meat-per-person",
      },
    ],
  },
  {
    slug: "cuts/veal",
    category: "Cut Library",
    title: "Kosher Veal Cut Guide",
    metaTitle: "Kosher Veal Cut Guide | Chops, Scallopini, Riblets, Stew",
    description:
      "Learn how to choose kosher veal chops, scallopini, schnitzel, riblets, stew meat, and ground veal by texture and cooking method.",
    updated: "May 15, 2026",
    readTime: "5 min read",
    heroImage: assets.veal,
    heroAlt: "Kosher veal cooked with onions and carrots in a skillet.",
    quickAnswer:
      "Veal is delicate. Thin cuts need fast cooking, chops need a controlled sear or roast, and stew or riblet cuts need gentle moisture.",
    facts: [
      {
        label: "Best for",
        value: "Quick sears, schnitzel, small special dinners",
      },
      { label: "Fast cuts", value: "Scallopini, schnitzel, thin cutlets" },
      { label: "Slow cuts", value: "Riblets, stew meat" },
    ],
    sections: [
      {
        id: "texture",
        heading: "What makes veal different",
        body: [
          "Veal is milder and more delicate than beef. That is the appeal, but it also means the cook has less room to hide rough handling.",
          "The key question is thickness. Thin veal is for speed. Thicker chops can take a careful sear and oven finish. Stew meat and riblets need moisture and patience.",
        ],
      },
      {
        id: "cuts",
        heading: "Common veal cuts",
        table: {
          columns: ["Cut", "Cooking style", "Watch out for"],
          rows: [
            [
              "Scallopini",
              "Very fast saute",
              "Overcooking and crowding the pan",
            ],
            ["Schnitzel", "Breaded quick fry", "Oil temperature and thickness"],
            [
              "Chops",
              "Sear and oven finish",
              "Dry edges before the center is ready",
            ],
            ["Riblets", "Gentle braise", "Rushing the cook"],
            ["Ground veal", "Meatballs, fillings, blends", "Underseasoning"],
          ],
        },
      },
      {
        id: "method",
        heading: "How to cook veal cleanly",
        body: [
          "Use moderate confidence, not brute force. Pat the surface dry, season clearly, cook in a hot pan without crowding, and remove thin pieces before they tighten.",
          "For braises, let the sauce do the work. Onions, carrots, tomatoes, wine, stock, herbs, and garlic all fit veal well without overpowering it.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is veal closer to beef or poultry in cooking style?",
        answer:
          "It is closer to beef in category, but it often needs the gentler timing people associate with poultry cutlets or schnitzel.",
      },
      {
        question: "What is the safest veal cut for a beginner?",
        answer:
          "Veal stew meat or riblets are more forgiving than very thin scallopini because slow cooking gives you more control.",
      },
    ],
    primaryCta: {
      label: "Search veal products",
      href: "/search?q=veal",
      event: "learn_collection_click",
    },
    related: [
      {
        label: "Best cuts for slow cooking",
        href: "/learn/guides/best-cuts-for-slow-cooking",
      },
      {
        label: "How much meat should I buy",
        href: "/learn/guides/how-much-meat-per-person",
      },
      {
        label: "Kosher Meat 101",
        href: "/learn/kosher-meat-101",
      },
    ],
  },
  {
    slug: "cuts/prepared-specialty",
    category: "Cut Library",
    title: "Prepared and Specialty Kosher Meat Guide",
    metaTitle: "Prepared and Specialty Kosher Meat Guide | Biltong, Boerewors",
    description:
      "Learn how to shop prepared and specialty kosher meat, including boerewors, biltong, droewors, pastrami, corned beef, pocket pies, kugels, and sides.",
    updated: "May 15, 2026",
    readTime: "6 min read",
    heroImage: assets.order,
    heroAlt: "A Grillers Pride order being assembled with specialty products.",
    quickAnswer:
      "Prepared and specialty products are where convenience, culture, and kashrut details meet. Read ingredients and labels carefully, then choose by occasion.",
    facts: [
      {
        label: "Best for",
        value: "South African specialties, Shabbos staples, gifting",
      },
      {
        label: "Read closely",
        value: "Ingredients, preparation, hechsher, KFP status",
      },
      {
        label: "High-value use",
        value: "Hard-to-find products in smaller communities",
      },
    ],
    sections: [
      {
        id: "why",
        heading: "Why specialty items matter",
        body: [
          "Specialty products are one of the strongest reasons customers choose Grillers Pride. Reviews call out biltong, boerewors, veal, corned beef brisket, schnitzel, bison, and custom cuts as products that are hard to find elsewhere.",
          "That makes education important. A customer may want biltong or boerewors because they grew up with it. Another customer may see the name for the first time and need a plain answer before adding it to a cart.",
        ],
      },
      {
        id: "south-african",
        heading: "South African specialties",
        body: [
          "Boerewors is a seasoned sausage associated with South African cooking. Biltong and droewors are dried meat specialties with a snack or appetizer role. They are not substitutes for a raw steak or roast. They serve a different job at the table.",
          "Because these are prepared products, the right shopping move is to read the product page for ingredients, casing, certification, storage, and Passover status.",
        ],
      },
      {
        id: "prepared",
        heading: "Prepared meats and sides",
        body: [
          "Corned beef, pastrami, pocket pies, kugels, and prepared sides can make a Shabbos or holiday order much easier. They also change the shopping question from only 'what cut is this?' to 'what is in it and how should I serve it?'",
          "Use prepared items to reduce cooking load, round out a basket, or give a remote family a taste of a larger kosher market.",
        ],
        bullets: [
          "Use biltong and droewors for snacks, travel, and appetizers.",
          "Use boerewors when you want a distinctive grill or pan item.",
          "Use corned beef and pastrami for deli-style meals and easy serving.",
          "Use sides and pocket pies to make a full order feel complete.",
        ],
      },
    ],
    faqs: [
      {
        question: "Are prepared items automatically kosher for Passover?",
        answer:
          "No. Prepared items need their own Passover status. Read the product page and packaging for item-level details.",
      },
      {
        question: "What is the difference between biltong and boerewors?",
        answer:
          "Biltong is a dried meat snack. Boerewors is a seasoned sausage that is cooked before serving.",
      },
    ],
    primaryCta: {
      label: "Shop specialty products",
      href: "/collections/prepared-and-provisions",
      event: "learn_collection_click",
    },
    related: [
      {
        label: "Kosher Meat 101",
        href: "/learn/kosher-meat-101",
      },
      {
        label: "Build a Shabbos meat order",
        href: "/learn/guides/shabbos-meat-order",
      },
      {
        label: "Frozen delivery and thawing",
        href: "/learn/guides/thawing-frozen-kosher-meat",
      },
    ],
  },
  {
    slug: "guides/how-much-meat-per-person",
    category: "Cooking & Buying Guides",
    title: "How Much Meat Should I Buy Per Person?",
    metaTitle: "How Much Meat Per Person | Kosher Butcher Buying Guide",
    description:
      "Portion guidance for kosher meat orders, including adults, children, Shabbos meals, Yom Tov tables, leftovers, and mixed menus.",
    updated: "May 15, 2026",
    readTime: "7 min read",
    heroImage: assets.order,
    heroAlt: "A Grillers Pride order being checked and packed.",
    quickAnswer:
      "For a main meat dish, plan about 8 oz raw boneless meat per adult when there are sides, and more when the meat is the main event or leftovers matter.",
    facts: [
      { label: "Baseline", value: "About 8 oz raw boneless meat per adult" },
      {
        label: "Bigger table",
        value: "Add cushion for holidays and leftovers",
      },
      { label: "Best use", value: "Planning before checkout" },
    ],
    sections: [
      {
        id: "baseline",
        heading: "The simple baseline",
        body: [
          "A practical butcher-counter baseline is 8 oz raw boneless meat per adult when the meal includes sides, soup, salads, challah, or other substantial dishes. For bone-in cuts, large roasts, and holiday centerpieces, add cushion.",
          "Children vary widely. For a mixed family table, count younger children as half portions and teenagers closer to adult portions. If leftovers are part of the plan, buy for the next meal rather than hoping the first meal leaves enough.",
        ],
      },
      {
        id: "table",
        heading: "Portion planning table",
        table: {
          columns: ["Meal type", "Planning range", "Notes"],
          rows: [
            [
              "Boneless main",
              "8 oz raw per adult",
              "Good for brisket slices, steaks, cutlets, burgers",
            ],
            [
              "Bone-in main",
              "10 to 14 oz raw per adult",
              "Bones reduce edible yield",
            ],
            [
              "Rich slow-cooked cut",
              "6 to 8 oz raw per adult",
              "Sauce and sides carry more of the meal",
            ],
            [
              "Appetizer or second protein",
              "3 to 5 oz raw per adult",
              "Use when there is another main",
            ],
            [
              "Leftovers planned",
              "Add 25 to 40 percent",
              "Best for Shabbos lunch or next-day meals",
            ],
          ],
        },
      },
      {
        id: "holiday",
        heading: "Holiday and Shabbos planning",
        body: [
          "Holiday meals are not normal meals. People linger, there are more courses, and the host usually wants leftovers. For brisket, roast, lamb shoulder, or chicken trays, the safest plan is to buy slightly more of the reliable main and use prepared sides to reduce cooking load.",
          "For Shabbos, think in meals rather than pounds. Friday night may need a centerpiece. Shabbos lunch may need cold cuts, chicken, cholent, or reheatable meat. Seudah shlishit may need lighter proteins or prepared items.",
        ],
      },
      {
        id: "mistakes",
        heading: "Common buying mistakes",
        bullets: [
          "Buying only lean cuts for a meal that needs to reheat.",
          "Ignoring bone weight when ordering ribs, shanks, whole birds, or chops.",
          "Forgetting children, guests, and leftovers in the same count.",
          "Buying too many new cuts at once instead of anchoring the meal with one familiar main.",
        ],
      },
    ],
    faqs: [
      {
        question: "How much brisket do I need for 10 adults?",
        answer:
          "For a main dish with sides, start around 5 lb raw boneless brisket. Add more if you want generous leftovers or if brisket is the only main.",
      },
      {
        question: "Should I count bone-in meat the same as boneless meat?",
        answer:
          "No. Bone-in cuts need more raw weight because some of what you buy is bone.",
      },
    ],
    primaryCta: {
      label: "Build a Shabbos order",
      href: "/learn/guides/shabbos-meat-order",
      event: "view_cut_guide",
    },
    secondaryCta: {
      label: "Shop the counter",
      href: "/store",
      event: "learn_collection_click",
    },
    related: [
      {
        label: "Brisket first cut, deckel, or whole",
        href: "/learn/guides/brisket-first-cut-deckel-whole",
      },
      {
        label: "Best cuts for slow cooking",
        href: "/learn/guides/best-cuts-for-slow-cooking",
      },
      {
        label: "Kosher poultry guide",
        href: "/learn/cuts/poultry",
      },
    ],
  },
  {
    slug: "guides/brisket-first-cut-deckel-whole",
    category: "Cooking & Buying Guides",
    title: "Brisket First Cut, Deckel, or Whole Brisket?",
    metaTitle: "Brisket First Cut vs Deckel vs Whole Brisket | Kosher Guide",
    description:
      "Compare kosher brisket first cut, deckel, and whole brisket by fat, tenderness, slicing, cook time, holiday fit, and leftovers.",
    updated: "May 15, 2026",
    readTime: "8 min read",
    heroImage: assets.beef,
    heroAlt: "Raw kosher beef cut in retail packaging.",
    quickAnswer:
      "Choose first cut for neat lean slices, deckel for richer and more forgiving meat, and whole brisket when you want a holiday centerpiece with both textures.",
    facts: [
      { label: "Leanest", value: "First cut" },
      { label: "Most forgiving", value: "Deckel" },
      { label: "Best centerpiece", value: "Whole brisket" },
    ],
    sections: [
      {
        id: "compare",
        heading: "The practical comparison",
        table: {
          columns: ["Choice", "Texture", "Best for"],
          rows: [
            [
              "First cut",
              "Leaner and easier to slice",
              "Neat holiday slices, lighter plates",
            ],
            [
              "Deckel",
              "Richer, softer, more marbled",
              "Forgiving braises and guests who like richness",
            ],
            [
              "Whole brisket",
              "Both lean and rich sections",
              "Large tables, holidays, leftovers",
            ],
            [
              "Corned brisket",
              "Cured and seasoned",
              "Deli-style meals and prepared serving",
            ],
          ],
        },
      },
      {
        id: "first-cut",
        heading: "First cut brisket",
        body: [
          "First cut brisket is the cleanest slicer. It is the piece many hosts picture when they think of a neat platter of brisket. The tradeoff is that it is leaner, so it needs moisture, protection, and careful reheating.",
          "If you want first cut, plan the sauce. Onions, garlic, tomato, wine, stock, carrots, and herbs all help. Cook it covered until tender, chill it before slicing if possible, then rewarm in its juices.",
        ],
      },
      {
        id: "deckel",
        heading: "Deckel",
        body: [
          "Deckel is richer and more forgiving. The extra fat and connective tissue can make it softer and more luxurious after a slow cook. It may not give the same tidy slices as first cut, but many tables prefer the eating experience.",
          "Choose deckel when you want comfort, richness, and a brisket that is less likely to dry out during reheating.",
        ],
      },
      {
        id: "whole",
        heading: "Whole brisket",
        body: [
          "Whole brisket gives you the full expression of the cut. It is best for a larger table or a host who wants both lean slices and richer pieces. It also gives the best leftover strategy.",
          "The main requirement is planning. Whole brisket takes space, time, and a clear serving plan. It is worth it when the meal is built around the meat.",
        ],
      },
      {
        id: "mistakes",
        heading: "Mistakes that make brisket disappointing",
        bullets: [
          "Cooking by time only instead of tenderness.",
          "Slicing with the grain instead of across the grain.",
          "Reheating lean brisket without enough sauce or cooking juices.",
          "Trying to rush a cut that needs slow heat.",
        ],
      },
    ],
    faqs: [
      {
        question: "Which brisket cut is best for Passover?",
        answer:
          "First cut is common for neat slices, but deckel and whole brisket can be better for a larger or richer holiday meal. Always check item-level Passover status.",
      },
      {
        question: "Can I cook brisket ahead?",
        answer:
          "Yes. Brisket often improves when cooked ahead, chilled, sliced, and reheated gently in sauce or cooking juices.",
      },
      {
        question: "Why is deckel sometimes preferred?",
        answer:
          "It is richer and more forgiving than lean first cut, which makes it easier to serve tender after a long cook or reheat.",
      },
    ],
    primaryCta: {
      label: "Shop kosher brisket",
      href: "/collections/kosher-brisket",
      event: "learn_collection_click",
    },
    secondaryCta: {
      label: "Read beef cut guide",
      href: "/learn/cuts/beef",
      event: "view_cut_guide",
    },
    related: [
      {
        label: "How much meat should I buy",
        href: "/learn/guides/how-much-meat-per-person",
      },
      {
        label: "Best cuts for slow cooking",
        href: "/learn/guides/best-cuts-for-slow-cooking",
      },
      {
        label: "Build a Shabbos meat order",
        href: "/learn/guides/shabbos-meat-order",
      },
    ],
  },
  {
    slug: "guides/best-cuts-for-slow-cooking",
    category: "Cooking & Buying Guides",
    title: "Best Kosher Meat Cuts for Slow Cooking",
    metaTitle: "Best Kosher Cuts for Slow Cooking | Cholent, Braises, Roasts",
    description:
      "A kosher butcher guide to the best slow-cooking cuts for cholent, braises, roasts, shanks, cheeks, ribs, and winter meals.",
    updated: "May 15, 2026",
    readTime: "7 min read",
    heroImage: assets.beef,
    heroAlt: "Raw kosher beef prepared for slow cooking.",
    quickAnswer:
      "For slow cooking, buy cuts with connective tissue, fat, bone, or dense muscle: brisket, deckel, flanken, short ribs, cheek, stew meat, lamb shoulder, lamb shanks, and dark poultry.",
    facts: [
      { label: "Best heat", value: "Low and steady" },
      { label: "Best texture", value: "Collagen-rich and bone-in cuts" },
      { label: "Best dishes", value: "Cholent, braises, soups, roasts" },
    ],
    sections: [
      {
        id: "why",
        heading: "Why slow cuts work",
        body: [
          "Slow cooking is not a rescue method for bad meat. It is the right method for cuts that are built with connective tissue, bone, fat, and deep flavor.",
          "As these cuts cook gently, tough structure softens and the cooking liquid gains body. That is why flanken, cheek, shanks, deckel, and stew meat can taste more satisfying than a lean premium cut in the wrong recipe.",
        ],
      },
      {
        id: "best-cuts",
        heading: "The best slow-cooking cuts",
        table: {
          columns: ["Cut", "Why it works", "Best dish"],
          rows: [
            ["Brisket", "Sliceable with enough time", "Holiday braise"],
            ["Deckel", "Richer and more forgiving", "Shabbos or Yom Tov roast"],
            ["Flanken", "Bone, fat, and deep flavor", "Cholent, soup, braise"],
            ["Cheek", "Gelatin-rich and intense", "Stew or low braise"],
            ["Lamb shoulder", "Rich and shreddable", "Pulled lamb or stew"],
            [
              "Lamb shanks",
              "Dramatic and saucy",
              "Individual braised portions",
            ],
            ["Chicken thighs", "Moist after reheating", "Trays and braises"],
          ],
        },
      },
      {
        id: "method",
        heading: "Slow cooking method",
        body: [
          "Season clearly, brown when useful, add aromatics, add enough liquid to protect the meat, cover, and cook until the texture says it is done. The fork should meet little resistance on braising cuts.",
          "For Shabbos and Yom Tov, plan around reheating. Richer cuts hold better than lean cuts. Saucy dishes hold better than dry roasts.",
        ],
        bullets: [
          "Use onions, garlic, carrots, celery, tomatoes, wine, stock, beans, barley, potatoes, and herbs.",
          "Keep meat meals meat-compatible with pareve or meat-based liquids.",
          "Rest or chill large cuts before slicing.",
          "Reheat gently with sauce or cooking juices.",
        ],
      },
    ],
    faqs: [
      {
        question: "What cut should I buy for cholent?",
        answer:
          "Flanken, stew meat, cheek, bones, deckel, and marrow bones are all strong choices because they can handle long cooking.",
      },
      {
        question: "Can I slow cook lean steaks?",
        answer:
          "Usually no. Lean grill cuts can become dry or chalky with long cooking. Save them for hot, quick methods.",
      },
    ],
    primaryCta: {
      label: "Shop slow-cooking cuts",
      href: "/collections/kosher-stew-braising",
      event: "learn_collection_click",
    },
    related: [
      {
        label: "Beef cut guide",
        href: "/learn/cuts/beef",
      },
      {
        label: "Brisket first cut, deckel, or whole",
        href: "/learn/guides/brisket-first-cut-deckel-whole",
      },
      {
        label: "Build a Shabbos meat order",
        href: "/learn/guides/shabbos-meat-order",
      },
    ],
  },
  {
    slug: "guides/best-cuts-for-grilling",
    category: "Cooking & Buying Guides",
    title: "Best Kosher Meat Cuts for Grilling",
    metaTitle: "Best Kosher Meat Cuts for Grilling | Steaks, Chops, Burgers",
    description:
      "Choose kosher steaks, lamb chops, burgers, boerewors, skirt, hanger, and poultry for grilling without drying out lean cuts.",
    updated: "May 15, 2026",
    readTime: "7 min read",
    heroImage: assets.beef,
    heroAlt: "Raw kosher beef cut ready for hot cooking.",
    quickAnswer:
      "For grilling, match the cut to the fire. Use steaks, burgers, lamb chops, boerewors, wings, thighs, skirt, hanger, and oyster steak, then slice lean cuts correctly.",
    facts: [
      { label: "Best heat", value: "Hot and controlled" },
      { label: "Most forgiving", value: "Burgers, thighs, chops, boerewors" },
      { label: "Needs slicing", value: "Skirt, hanger, London broil" },
    ],
    sections: [
      {
        id: "choose",
        heading: "Choose by grill behavior",
        body: [
          "A grill rewards fat, surface area, and timing. Burgers, lamb chops, poultry thighs, wings, and boerewors are forgiving because they have fat, shape, or portioning on their side.",
          "Lean beef cuts can be excellent, but they need a hotter, shorter cook and slicing across the grain. If you treat London broil like a ribeye, it will not eat like one.",
        ],
        table: {
          columns: ["Cut", "Grill style", "Serving move"],
          rows: [
            ["Burgers", "Direct heat", "Rest briefly and serve hot"],
            ["Lamb chops", "Hot sear", "Keep simple and avoid overcooking"],
            [
              "Chicken thighs",
              "Moderate direct or indirect heat",
              "Cook through without drying",
            ],
            [
              "Wings",
              "Moderate heat then finish hot",
              "Use pareve sauces or dry rubs",
            ],
            ["Skirt or hanger", "Very hot and quick", "Slice across the grain"],
            [
              "Boerewors",
              "Moderate heat",
              "Cook gently so the casing does not burst",
            ],
          ],
        },
      },
      {
        id: "kosher-safe",
        heading: "Keep the guidance kosher-safe",
        body: [
          "Grill advice for meat should stay meat-compatible. Use olive oil, avocado oil, schmaltz, rendered beef fat, citrus, herbs, spice rubs, onions, peppers, mushrooms, wine, stock, and pareve sauces.",
          "Avoid dairy finishes, cheese toppings, butter sauces, and creamy sides in meat-specific recommendations.",
        ],
      },
      {
        id: "mistakes",
        heading: "Common grilling mistakes",
        bullets: [
          "Starting before the grill is hot enough.",
          "Moving thin cuts constantly instead of letting them sear.",
          "Skipping the rest on steaks and chops.",
          "Slicing skirt, hanger, or London broil with the grain.",
          "Cooking poultry skin too hot before the inside is ready.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the easiest kosher cut to grill?",
        answer:
          "Burgers, lamb chops, chicken thighs, and boerewors are easier than lean beef steaks because they are more forgiving.",
      },
      {
        question: "How do I keep lean steaks from drying out?",
        answer:
          "Use high heat, avoid overcooking, rest the meat, and slice thinly across the grain.",
      },
    ],
    primaryCta: {
      label: "Shop grill cuts",
      href: "/collections/kosher-steaks",
      event: "learn_collection_click",
    },
    related: [
      {
        label: "Beef cut guide",
        href: "/learn/cuts/beef",
      },
      {
        label: "Lamb cut guide",
        href: "/learn/cuts/lamb",
      },
      {
        label: "Prepared and specialty guide",
        href: "/learn/cuts/prepared-specialty",
      },
    ],
  },
  {
    slug: "guides/thawing-frozen-kosher-meat",
    category: "Cooking & Buying Guides",
    title: "How to Thaw Frozen Kosher Meat Safely",
    metaTitle: "How to Thaw Frozen Kosher Meat Safely | Dry Ice Delivery Guide",
    description:
      "What to do when frozen kosher meat arrives with dry ice, how to store it, how to thaw it safely, and how to plan cooking time.",
    updated: "May 15, 2026",
    readTime: "6 min read",
    heroImage: assets.coldPack,
    heroAlt: "Frozen kosher meat packed for cold-chain delivery.",
    quickAnswer:
      "Move frozen meat to the freezer when it arrives. Thaw in the refrigerator when possible, use cold water for faster thawing, and avoid leaving meat at room temperature.",
    facts: [
      { label: "Best thaw", value: "Refrigerator thawing" },
      { label: "Faster thaw", value: "Cold water in sealed packaging" },
      { label: "Avoid", value: "Countertop thawing" },
    ],
    sections: [
      {
        id: "arrival",
        heading: "When the box arrives",
        body: [
          "Open the shipment in a ventilated area, keep hands away from dry ice, and move the meat into the freezer if you are not cooking soon. If a product is partially thawed but still cold, handle it as a time-sensitive refrigerated item and cook promptly.",
          "Do not leave the box sitting because you plan to deal with it later. The cold chain did its job during shipping. Your job is to move the order into safe storage.",
        ],
      },
      {
        id: "methods",
        heading: "Safe thawing methods",
        table: {
          columns: ["Method", "Best for", "Important rule"],
          rows: [
            [
              "Refrigerator",
              "Most roasts, poultry, steaks, ground meat",
              "Plan ahead and keep meat cold",
            ],
            [
              "Cold water",
              "Smaller sealed packages",
              "Change water often and cook after thawing",
            ],
            [
              "Microwave",
              "Immediate cooking only",
              "Cook right away after thawing",
            ],
          ],
        },
      },
      {
        id: "planning",
        heading: "Plan thawing by size",
        body: [
          "Small steaks, cutlets, burgers, and ground meat thaw much faster than brisket, whole poultry, turkey, lamb shoulder, or large roasts. The bigger the cut, the more important it is to move it from freezer to refrigerator early.",
          "For a holiday or Shabbos meal, build thawing into the cooking plan. A safe thawing plan prevents the host from rushing, soaking, or leaving meat out too long.",
        ],
      },
      {
        id: "food-safety",
        heading: "Food-safety baseline",
        body: [
          "USDA food-safety guidance recommends thawing food in the refrigerator, in cold water, or in the microwave, not on the counter. Whole cuts of beef, lamb, veal, and pork have a 145 F minimum internal temperature with rest time in USDA guidance, while ground meats have a 160 F minimum.",
          "Kosher practice determines what belongs in the kitchen. Food-safety practice determines how cold, hot, and time-sensitive foods should be handled.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I thaw kosher meat on the counter?",
        answer:
          "No. Use the refrigerator when possible. Cold water can work for sealed packages when you need a faster method.",
      },
      {
        question: "What should I do with dry ice?",
        answer:
          "Do not touch dry ice with bare hands. Let it dissipate in a ventilated area away from children, pets, and sealed containers.",
      },
    ],
    primaryCta: {
      label: "Read UPS shipping details",
      href: "/shipping/ups",
      event: "learn_collection_click",
    },
    related: [
      {
        label: "How much meat should I buy",
        href: "/learn/guides/how-much-meat-per-person",
      },
      {
        label: "Build a Shabbos meat order",
        href: "/learn/guides/shabbos-meat-order",
      },
      {
        label: "Kosher poultry guide",
        href: "/learn/cuts/poultry",
      },
    ],
    sources: foodSafetySources,
  },
  {
    slug: "guides/shabbos-meat-order",
    category: "Cooking & Buying Guides",
    title: "How to Build a Shabbos Meat Order",
    metaTitle: "How to Build a Shabbos Meat Order | Kosher Butcher Guide",
    description:
      "A practical basket plan for Shabbos meat orders, including mains, cholent, poultry, prepared items, soup bones, deli, and leftovers.",
    updated: "May 15, 2026",
    readTime: "7 min read",
    heroImage: assets.order,
    heroAlt: "A Grillers Pride order being assembled for a customer.",
    quickAnswer:
      "Build the order by meals. Choose one Friday night main, one reheatable lunch plan, one backup protein, one prepared convenience item, and one freezer builder.",
    facts: [
      { label: "Best anchor", value: "One reliable main" },
      {
        label: "Best lunch help",
        value: "Cholent cuts, dark poultry, deli, prepared items",
      },
      { label: "Best habit", value: "Add one freezer builder per order" },
    ],
    sections: [
      {
        id: "framework",
        heading: "Think in meals, not just products",
        body: [
          "A strong Shabbos order is not a random cart. It solves Friday night, Shabbos lunch, guests, leftovers, and the freezer.",
          "Start with the meal that matters most, then add products that reduce pressure. Prepared sides, deli, soup bones, cholent cuts, and reheatable poultry can be just as important as the centerpiece.",
        ],
      },
      {
        id: "basket",
        heading: "A practical Shabbos basket",
        table: {
          columns: ["Basket role", "Good choices", "Why it helps"],
          rows: [
            [
              "Friday night main",
              "Brisket, roast chicken, lamb shoulder",
              "Gives the table an anchor",
            ],
            [
              "Lunch plan",
              "Cholent meat, flanken, deckel, dark poultry",
              "Handles long holding and reheating",
            ],
            [
              "Fast backup",
              "Burgers, cutlets, ground beef",
              "Covers schedule changes",
            ],
            [
              "Prepared support",
              "Kugels, sides, deli, pocket pies",
              "Reduces cooking load",
            ],
            [
              "Freezer builder",
              "Bones, stew meat, ground meat",
              "Makes the next order easier",
            ],
          ],
        },
      },
      {
        id: "repeat",
        heading: "The repeat-order strategy",
        body: [
          "The best recurring orders have a stable core and one rotating experiment. Keep the cuts your household already trusts, then add one unfamiliar cut with a guide attached.",
          "This is how a customer moves from chicken breasts and ground beef into brisket, flanken, lamb chops, veal, biltong, or South African specialties without feeling like the whole meal is at risk.",
        ],
      },
      {
        id: "calls",
        heading: "What this should answer before a call",
        bullets: [
          "Which cut should anchor Friday night?",
          "Which cuts reheat well for lunch?",
          "How much meat should I buy for the table?",
          "What can I add to make the order feel complete?",
          "Which unfamiliar cut is safe to try first?",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the safest Shabbos meat main?",
        answer:
          "Brisket, deckel, roast chicken, and dark poultry trays are reliable because they can be cooked ahead and served with less last-minute work.",
      },
      {
        question: "How do I try a new cut without risking the meal?",
        answer:
          "Keep the main familiar and add the new cut as a smaller second item, appetizer, or freezer builder.",
      },
    ],
    primaryCta: {
      label: "Shop the counter",
      href: "/store",
      event: "learn_collection_click",
    },
    secondaryCta: {
      label: "Read portion guide",
      href: "/learn/guides/how-much-meat-per-person",
      event: "view_cut_guide",
    },
    related: [
      {
        label: "Best cuts for slow cooking",
        href: "/learn/guides/best-cuts-for-slow-cooking",
      },
      {
        label: "Kosher poultry guide",
        href: "/learn/cuts/poultry",
      },
      {
        label: "Prepared and specialty guide",
        href: "/learn/cuts/prepared-specialty",
      },
    ],
  },
]

export const learnArticleMap = new Map(
  learnArticles.map((article) => [article.slug, article])
)

export function normalizeLearnSlug(slug: string | string[]) {
  return Array.isArray(slug) ? slug.join("/") : slug
}

export function getLearnArticle(slug: string | string[]) {
  return learnArticleMap.get(normalizeLearnSlug(slug))
}

export function getLearnArticleStaticParams() {
  return learnArticles.map((article) => ({
    slug: article.slug.split("/"),
  }))
}
