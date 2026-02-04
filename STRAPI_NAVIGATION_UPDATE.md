# Strapi Navigation Structure Update

## Objective
Update the header navigation in Strapi to support a multi-level mega menu with sections, featured items, and bottom bar information.

## Current vs New Structure

### Current (Simple 2-level):
```
HeaderNav
├── Link { Text, Url }
└── Children [{ Text, Url }]
```

### New (Mega Menu with Sections):
```
HeaderNav
├── id
├── title
├── sections [
│   ├── title
│   └── items [{ Text, Url }]
│   ]
├── featured {
│   ├── title
│   ├── description
│   ├── badge
│   └── image
│   }
└── bottomBar {
    ├── certifications [{ icon, text }]
    ├── viewAllText
    └── viewAllUrl
    }
```

## Step-by-Step Instructions

### 1. Create New Components

Create these four new components in the **Navigation** or **Common** category:

#### Component: `nav.section` (or `ComponentNavSection`)
**Fields:**
- `title` (Text, Short text)
- `items` (Relation: Component, Repeatable, select existing `ComponentCommonLink`)

#### Component: `nav.featured` (or `ComponentNavFeatured`)
**Fields:**
- `title` (Text, Short text)
- `description` (Text, Long text)
- `badge` (Text, Short text)
- `image` (Media, Single image, optional)

#### Component: `nav.certification` (or `ComponentNavCertification`)
**Fields:**
- `icon` (Text, Short text) - Values like: "award", "clock", "star", "check"
- `text` (Text, Short text)

#### Component: `nav.bottom-bar` (or `ComponentNavBottomBar`)
**Fields:**
- `certifications` (Component, Repeatable, select `ComponentNavCertification`)
- `viewAllText` (Text, Short text)
- `viewAllUrl` (Text, Short text)

### 2. Update or Create Main Navigation Component

Update `ComponentCommonHeaderNav` (or create new `ComponentNavMenuItem`):

**Fields:**
- `id` (UID, required) - URL-friendly identifier like "beef", "poultry"
- `title` (Text, Short text, required) - Display name like "Beef", "Poultry"
- `sections` (Component, Repeatable, select `ComponentNavSection`)
- `featured` (Component, Single, select `ComponentNavFeatured`, optional)
- `bottomBar` (Component, Single, select `ComponentNavBottomBar`, optional)

### 3. Update Header Content Type

In the **Header** single type, update the `HeaderNav` field:
- Change it to Component (Repeatable)
- Select the updated `ComponentCommonHeaderNav` or new `ComponentNavMenuItem`

### 4. Populate with Example Data

Create these menu items in the Header content type:

#### Menu Item 1: Prepared Foods
```
id: prepared-foods
title: Prepared Foods

sections:
  - title: Ready to Eat
    items:
      - Text: Entree Dishes, Url: /store?category=entree-dishes
      - Text: Side Dishes, Url: /store?category=side-dishes
      - Text: Soups & Matzo Balls, Url: /store?category=soups
      - Text: Desserts, Url: /store?category=desserts
  
  - title: Ready to Cook
    items:
      - Text: Meal Kits, Url: /store?category=meal-kits
      - Text: Marinated Meats, Url: /store?category=marinated-meats
      - Text: Stuffed Items, Url: /store?category=stuffed-items
  
  - title: Smoked & Cured
    items:
      - Text: Smoked Salmon, Url: /store?category=smoked-salmon
      - Text: Smoked Trout, Url: /store?category=smoked-trout
      - Text: Pocket Pies, Url: /store?category=pocket-pies
      - Text: Deli Rolls, Url: /store?category=deli-rolls

featured:
  title: Featured: Chef's Special
  description: House-made entree dishes
  badge: New

bottomBar:
  certifications:
    - icon: award, text: Glatt Kosher Certified
    - icon: clock, text: Fresh Daily Delivery
  viewAllText: View All Prepared Foods
  viewAllUrl: /store?type=prepared-foods
```

#### Menu Item 2: Beef
```
id: beef
title: Beef

sections:
  - title: By Cut
    items:
      - Text: Briskets, Url: /store?category=briskets
      - Text: Steaks, Url: /store?category=steaks
      - Text: Roasts, Url: /store?category=roasts
      - Text: Ground Beef, Url: /store?category=ground-beef
      - Text: Ribs & Flanken, Url: /store?category=ribs-flanken
      - Text: London Broils, Url: /store?category=london-broils
  
  - title: By Type
    items:
      - Text: Butcher's Choice, Url: /collections/butchers-choice
      - Text: Grass Fed & Natural, Url: /collections/grass-fed
      - Text: Certified Organic, Url: /collections/organic-beef
      - Text: Budget Friendly, Url: /collections/budget-beef
  
  - title: Specialty
    items:
      - Text: Corned Beef, Url: /store?category=corned-beef
      - Text: Stew Meat, Url: /store?category=stew-meat
      - Text: Soup Bones, Url: /store?category=soup-bones
      - Text: Beef Liver, Url: /store?category=beef-liver

featured:
  title: Featured: Premium Brisket
  description: Our signature grass-fed brisket
  badge: Best Seller

bottomBar:
  certifications:
    - icon: award, text: Glatt Kosher Certified
    - icon: clock, text: Fresh Daily Delivery
  viewAllText: View All Beef
  viewAllUrl: /store?type=beef
```

#### Menu Item 3: Poultry
```
id: poultry
title: Poultry

sections:
  - title: Chicken
    items:
      - Text: Whole Chickens, Url: /store?category=whole-chickens
      - Text: Breasts, Url: /store?category=chicken-breasts
      - Text: Thighs, Url: /store?category=chicken-thighs
      - Text: Wings, Url: /store?category=chicken-wings
      - Text: Ground Chicken, Url: /store?category=ground-chicken
      - Text: Schnitzel, Url: /store?category=schnitzel
  
  - title: Turkey & Duck
    items:
      - Text: Whole Turkey, Url: /store?category=whole-turkey
      - Text: Turkey Breasts, Url: /store?category=turkey-breasts
      - Text: Ground Turkey, Url: /store?category=ground-turkey
      - Text: Whole Duck, Url: /store?category=whole-duck
      - Text: Duck Breasts, Url: /store?category=duck-breasts
  
  - title: By Source
    items:
      - Text: David Elliot, Url: /collections/david-elliot
      - Text: AgriStar, Url: /collections/agristar
      - Text: Organic, Url: /collections/organic-poultry
      - Text: Antibiotic-Free, Url: /collections/antibiotic-free

featured:
  title: Featured: Organic Chicken
  description: Free-range, certified organic
  badge: Organic

bottomBar:
  certifications:
    - icon: award, text: Glatt Kosher Certified
    - icon: clock, text: Fresh Daily Delivery
  viewAllText: View All Poultry
  viewAllUrl: /store?type=poultry
```

#### Menu Item 4: Lamb & Veal
```
id: lamb-veal
title: Lamb & Veal

sections:
  - title: Lamb Cuts
    items:
      - Text: Leg of Lamb, Url: /store?category=leg-of-lamb
      - Text: Lamb Chops, Url: /store?category=lamb-chops
      - Text: Rack of Lamb, Url: /store?category=rack-of-lamb
      - Text: Ground Lamb, Url: /store?category=ground-lamb
      - Text: Lamb Shanks, Url: /store?category=lamb-shanks
  
  - title: Veal Cuts
    items:
      - Text: Veal Chops, Url: /store?category=veal-chops
      - Text: Veal Roasts, Url: /store?category=veal-roasts
      - Text: Ground Veal, Url: /store?category=ground-veal
      - Text: Veal Cutlets, Url: /store?category=veal-cutlets
      - Text: Veal Shanks, Url: /store?category=veal-shanks

featured:
  title: Featured: Rack of Lamb
  description: Perfect for special occasions
  badge: Premium

bottomBar:
  certifications:
    - icon: award, text: Glatt Kosher Certified
    - icon: clock, text: Fresh Daily Delivery
  viewAllText: View All Lamb & Veal
  viewAllUrl: /store?type=lamb-veal
```

#### Menu Item 5: Sausages, Burgers, Hotdogs
```
id: sausages-burgers-hotdogs
title: Sausages, Burgers, Hotdogs

sections:
  - title: Sausages
    items:
      - Text: Gourmet Sausages, Url: /store?category=gourmet-sausages
      - Text: Beef Sausages, Url: /store?category=beef-sausages
      - Text: Chicken Sausages, Url: /store?category=chicken-sausages
      - Text: Turkey Sausages, Url: /store?category=turkey-sausages
  
  - title: Burgers
    items:
      - Text: Gourmet Burgers, Url: /store?category=gourmet-burgers
      - Text: Beef Burgers, Url: /store?category=beef-burgers
      - Text: Chicken Burgers, Url: /store?category=chicken-burgers
      - Text: Turkey Burgers, Url: /store?category=turkey-burgers
  
  - title: Hotdogs
    items:
      - Text: Beef Hotdogs, Url: /store?category=beef-hotdogs
      - Text: Chicken Hotdogs, Url: /store?category=chicken-hotdogs
      - Text: Turkey Dogs, Url: /store?category=turkey-dogs
      - Text: Beef Franks, Url: /store?category=beef-franks

featured:
  title: Featured: Artisan Sausages
  description: Handcrafted gourmet varieties
  badge: Artisan

bottomBar:
  certifications:
    - icon: award, text: Glatt Kosher Certified
    - icon: clock, text: Fresh Daily Delivery
  viewAllText: View All Sausages & More
  viewAllUrl: /store?type=sausages-burgers-hotdogs
```

#### Menu Item 6: Deli
```
id: deli
title: Deli

sections:
  - title: Sliced Meats
    items:
      - Text: Sliced Deli, Url: /store?category=sliced-deli
      - Text: Deli Chubs, Url: /store?category=deli-chubs
      - Text: Pastrami, Url: /store?category=pastrami
      - Text: Corned Beef, Url: /store?category=corned-beef-deli
  
  - title: Specialty Items
    items:
      - Text: Salami Sticks, Url: /store?category=salami-sticks
      - Text: Biltong, Url: /store?category=biltong
      - Text: Drywors, Url: /store?category=drywors
      - Text: Smoked Meats, Url: /store?category=smoked-meats

featured:
  title: Featured: Fresh Sliced Deli
  description: Cut fresh to order daily
  badge: Fresh Daily

bottomBar:
  certifications:
    - icon: award, text: Glatt Kosher Certified
    - icon: clock, text: Fresh Daily Delivery
  viewAllText: View All Deli
  viewAllUrl: /store?type=deli
```

#### Menu Item 7: Provisions
```
id: provisions
title: Provisions

sections:
  - title: Essentials
    items:
      - Text: Cooking Supplies, Url: /store?category=cooking-supplies
      - Text: Seasonings, Url: /store?category=seasonings
      - Text: Kosher Accessories, Url: /store?category=kosher-accessories

featured:
  title: Featured: Cooking Essentials
  description: Everything you need
  badge: Essential

bottomBar:
  certifications:
    - icon: award, text: Glatt Kosher Certified
  viewAllText: View All Provisions
  viewAllUrl: /store?type=provisions
```

### 5. Add "Seasonal Specials" Link

This is a standalone link (not a mega menu). You can either:

**Option A:** Add a separate field in Header content type:
- `SpecialLink` (Component, Single, use `ComponentCommonLink`)
- Text: "Seasonal Specials"
- Url: "/specials"

**Option B:** Add it as a navigation item with no sections/featured (keep it simple)

## Verification

After completing these steps:

1. ✅ Check that Header content type has all 7 menu items
2. ✅ Each menu item has 2-3 sections with items
3. ✅ Each menu item has a featured section
4. ✅ Each menu item has a bottom bar with certifications
5. ✅ All URLs are correct
6. ✅ Publish the Header content

## GraphQL Query Structure

The frontend will query this data like:
```graphql
query HeaderNav {
  header {
    HeaderNav {
      id
      title
      sections {
        title
        items {
          Text
          Url
        }
      }
      featured {
        title
        description
        badge
        image {
          url
        }
      }
      bottomBar {
        certifications {
          icon
          text
        }
        viewAllText
        viewAllUrl
      }
    }
  }
}
```

Once complete, let the frontend developer know the structure is ready!
