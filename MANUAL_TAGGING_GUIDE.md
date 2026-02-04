# Manual Product Tagging Guide

## Current Status

**API Limitation Discovered**: Strapi's GraphQL API doesn't allow updating component relations (like Categorization.ProductTags) through mutations. Products must be tagged manually through the Strapi admin UI.

## What Was Completed

✅ **Navigation-to-Tag Mapping**: 50 out of 73 menu items automatically mapped to tags  
✅ **Gap Analysis**: Full report of what's mapped, what's missing  
✅ **Tag Collection Support**: Code ready to work once products are tagged  
✅ **Helper Functions**: Slug generation from tag names

## Products Requiring Manual Tagging

**Total Products in Strapi**: 764  
**Estimated Products Needing Tags**: ~613 (based on title matching)  
**Products Without Good Matches**: ~151

## How to Tag Products in Strapi Admin

1. **Go to**: https://helpful-nature-fab70f9c51.strapiapp.com/admin
2. **Navigate to**: Content Manager → Collection Types → Product
3. **For each product**:
   - Click to edit
   - Scroll to "Categorization" component
   - Click "+ Add" under "ProductTags"
   - Select 2-3 appropriate tags:
     - Usually 1 L2 tag (category like "Beef", "Chicken")
     - 1-2 L3 tags (specific like "Brisket", "Ground Beef")
   - Save and Publish

## Tag Assignment Examples

### Example 1: Brisket Product
**Title**: "First Cut Brisket, Trimmed, 6-7 lb., Uncooked"  
**Assign Tags**:
- L2: Beef
- L3: Brisket
- L3: Brisket First Cut

**Result**: Product will appear in `/collections/beef`, `/collections/brisket`, `/collections/brisket-first-cut`

### Example 2: Chicken Product  
**Title**: "Whole Chickens, 2.5 lb., Uncooked"  
**Assign Tags**:
- L2: Chicken
- L3: Whole Chickens

**Result**: Product appears in `/collections/chicken`, `/collections/whole-chickens`

### Example 3: Prepared Food
**Title**: "Chicken Soup with Matzo Balls, Quart Container"  
**Assign Tags**:
- L2: Soups
- L3: Chicken Soup
- L3: Matzo Balls

## Quick Start: Tag 10 Products for Testing

To test the system quickly, manually tag these 10 product types:

1. **Any Brisket** → L2: Beef, L3: Brisket
2. **Any Ground Beef** → L2: Beef, L3: Ground Beef
3. **Any Whole Chicken** → L2: Chicken, L3: Whole Chickens
4. **Any Wings** → L2: Chicken, L3: Chicken Wings
5. **Any Turkey Breast** → L2: Turkey, L3: Turkey Breast Boneless
6. **Any Lamb Chops** → L2: Lamb, L3: Lamb Chops
7. **Any Beef Sausages** → L2: Franks & Dogs, L3: Beef Sausages
8. **Any Pastrami** → L2: Sliced Meats, L3: Pastrami
9. **Any Soup** → L2: Soups, L3: Chicken Soup (or appropriate)
10. **Any Dessert** → L2: Desserts, L3: (appropriate subcategory)

## Test URLs (Once Products Are Tagged)

After tagging the 10 products above, these URLs will work:

1. **http://localhost:8000/us/collections/brisket** - Brisket products
2. **http://localhost:8000/us/collections/ground-beef** - Ground beef products
3. **http://localhost:8000/us/collections/whole-chickens** - Whole chickens
4. **http://localhost:8000/us/collections/lamb-chops** - Lamb chop products

## Navigation URLs Ready to Update

The system is ready. Once you've tagged products, I can update all navigation URLs from `#` to working collection pages.

**50 menu items are mapped and ready**, including:
- All beef cuts (Briskets, Steaks, Roasts, etc.)
- All poultry items (Whole Chickens, Wings, Turkey, etc.)
- All sausages and deli items
- Prepared foods

## What Happens When You Tag Products

1. **Product gets tags in Strapi** → Categorization.ProductTags populated
2. **Algolia re-indexes** → Product searchable by tag
3. **Collections work automatically** → `/collections/{tag-slug}` shows tagged products
4. **Navigation links work** → Menu items link to actual product pages

## Alternative: Bulk Tagging via Strapi API

If you have Strapi API access beyond GraphQL (REST API with proper auth), I can create a bulk tagging script. But that requires different credentials/permissions than what the GraphQL token provides.
