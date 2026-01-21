import { test, expect } from "@playwright/test"

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/us")
  })

  test("should display the hero section", async ({ page }) => {
    // Check for hero section
    const hero = page.locator("section[role='img']")
    await expect(hero).toBeVisible()

    // Check for hero title
    const heroTitle = page.locator("h1")
    await expect(heroTitle).toBeVisible()
  })

  test("should have skip to main content link", async ({ page }) => {
    // Check for skip link (accessibility)
    const skipLink = page.locator("a[href='#main-content']")
    await expect(skipLink).toBeAttached()
  })

  test("should display navigation", async ({ page }) => {
    // Check for main navigation
    const nav = page.locator("nav").first()
    await expect(nav).toBeVisible()

    // Check for logo
    const logo = page.locator("img[alt='logo']").first()
    await expect(logo).toBeVisible()
  })

  test("should have cart button", async ({ page }) => {
    // Check for cart link
    const cartLink = page.locator("[data-testid='nav-cart-link']")
    await expect(cartLink).toBeVisible()
  })
})

test.describe("Navigation", () => {
  test("should navigate to store page", async ({ page }) => {
    await page.goto("/us")
    
    // Look for a shop/store link in navigation
    const storeLink = page.locator("a[href*='/store'], a[href*='/collections']").first()
    
    if (await storeLink.isVisible()) {
      await storeLink.click()
      await expect(page).toHaveURL(/\/(store|collections)/)
    }
  })

  test("should navigate to cart page", async ({ page }) => {
    await page.goto("/us")
    
    const cartLink = page.locator("[data-testid='nav-cart-link']")
    await cartLink.click()
    
    await expect(page).toHaveURL(/\/cart/)
  })
})

test.describe("Search", () => {
  test("should have search functionality on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto("/us")
    
    // Check for search input
    const searchInput = page.locator("input[placeholder*='Search']")
    await expect(searchInput).toBeVisible()
  })

  test("should have mobile search button on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/us")
    
    // Check for mobile search button
    const mobileSearchButton = page.locator("button[aria-label='Open search']")
    await expect(mobileSearchButton).toBeVisible()
  })
})

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/us")
    
    // Check that there's an h1
    const h1 = page.locator("h1")
    await expect(h1).toBeVisible()
  })

  test("should have alt text on images", async ({ page }) => {
    await page.goto("/us")
    
    // Check that visible images have alt attributes
    const images = page.locator("img:visible")
    const count = await images.count()
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute("alt")
      // Alt can be empty string for decorative images, but must exist
      expect(alt).not.toBeNull()
    }
  })
})
