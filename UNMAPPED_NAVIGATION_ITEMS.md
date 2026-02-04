# Unmapped Navigation Items

**Status**: 23 out of 73 navigation items still point to "#" and need URLs assigned

**Last Updated**: January 25, 2026

---

## Summary

- **Total Menu Items**: 73
- **Mapped (have URLs)**: 50 ✅
- **Unmapped (still "#")**: 23 ❌

---

## Unmapped Items by Menu

### Prepared Foods (5 items)

1. **Ready to Eat** → Entree Dishes
2. **Ready to Eat** → Side Dishes
3. **Ready to Cook** → Marinated Meats
4. **Ready to Cook** → Stuffed Items
5. **Smoked & Cured** → Smoked Trout

### Beef (6 items)

6. **By Type** → Butcher's Choice
7. **By Type** → Grass Fed & Natural
8. **By Type** → Certified Organic
9. **By Type** → Budget Friendly
10. **Specialty** → Stew Meat
11. **Specialty** → Soup Bones

### Poultry (4 items)

12. **By Source** → David Elliot
13. **By Source** → AgriStar
14. **By Source** → Organic
15. **By Source** → Antibiotic-Free

### Sausages, Burgers, Hotdogs (2 items)

16. **Sausages** → Gourmet Sausages
17. **Burgers** → Gourmet Burgers

### Deli (4 items)

18. **Sliced Meats** → Sliced Deli
19. **Sliced Meats** → Deli Chubs
20. **Specialty Items** → Drywors
21. **Specialty Items** → Smoked Meats

### Provisions (2 items)

22. **Essentials** → Cooking Supplies
23. **Essentials** → Kosher Accessories

---

## Recommended Actions

### Items Needing New Tags (8 items)

Create these new product tags in Strapi:

- **Entree Dishes** → Create L3: Entree Dishes
- **Side Dishes** → Create L3: Side Dishes (or map to existing L2: Sides)
- **Marinated Meats** → Create L3: Marinated Meats
- **Stuffed Items** → Create L3: Stuffed Items
- **Smoked Trout** → Create L3: Smoked Trout
- **Gourmet Sausages** → Create L3: Gourmet Sausages
- **Gourmet Burgers** → Create L3: Gourmet Burgers
- **Drywors** → Create L3: Drywors
- **Kosher Accessories** → Create L3: Kosher Accessories

### Items Needing Manual Mapping (4 items)

Map to existing tags:

- **Stew Meat** → Map to existing L3: Stew & Braising Meat
- **Soup Bones** → Map to existing L3: Soup & Marrow Bones
- **Sliced Deli** → Map to existing L2: Sliced Meats
- **Deli Chubs** → Map to existing L3: Salami Chubs
- **Smoked Meats** → Create generic L3: Smoked Meats tag
- **Cooking Supplies** → Map to L2: Pantry or L2: Baking Supplies

### Items Best as Collections/Filters (10 items)

These are attributes, not product types - use Medusa collections or filters:

**Quality/Sourcing Attributes:**
- Butcher's Choice (curated selection)
- Grass Fed & Natural (sourcing attribute)
- Certified Organic (certification)
- Budget Friendly (price tier)

**Supplier/Brand Names:**
- David Elliot (brand filter)
- AgriStar (brand filter)

**Certifications:**
- Organic (metadata filter)
- Antibiotic-Free (metadata filter)

---

## Notes

- Items 6-9 and 12-15 should use a different approach than tag-based collections
- Consider using Medusa collections for curated/attribute-based groupings
- Consider using Algolia faceted filters for certifications and brands
