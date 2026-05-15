#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const { chromium, devices } = require("@playwright/test")

const args = new Set(process.argv.slice(2))
const baseArg = process.argv.find((arg) => arg.startsWith("--base-url="))
const baseUrl = (
  (baseArg && baseArg.split("=").slice(1).join("=")) ||
  process.env.MOBILE_AUDIT_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "")

const failOnSmallTargets = args.has("--fail-on-small-targets")
const takeScreenshots = args.has("--screenshots")

const routes = [
  { name: "home", path: "/us" },
  { name: "collection-beef", path: "/us/collections/kosher-beef" },
  {
    name: "collection-beef-filter-sheet",
    path: "/us/collections/kosher-beef",
    interactions: ["open-mobile-filters"],
  },
  {
    name: "search-beef",
    path: "/us/search?q=beef",
  },
  {
    name: "search-beef-filter-sheet",
    path: "/us/search?q=beef",
    interactions: ["open-mobile-filters"],
  },
  {
    name: "pdp-ground-beef",
    path:
      "/us/products/1-lb-pack-ground-beef-8020-100-grass-fed-all-natural-no-hormones-no-antibiotics-uncooked-not-kosher-for-passover-1399pack",
  },
  { name: "cart", path: "/us/cart" },
  { name: "checkout-empty", path: "/us/checkout" },
  { name: "account", path: "/us/account" },
  { name: "account-payment-methods", path: "/us/account/payment-methods" },
  { name: "recipes", path: "/us/recipes" },
  { name: "about", path: "/us/about" },
  { name: "customer-service", path: "/us/customer-service" },
]

const viewports = [
  { name: "iphone-se", width: 375, height: 667, device: devices["iPhone SE"] },
  {
    name: "iphone-14-pro",
    width: 393,
    height: 852,
    device: devices["iPhone 14 Pro"],
  },
  { name: "mobile-wide", width: 606, height: 900 },
]

const outDir = path.join(process.cwd(), "test-results", "mobile-audit")
fs.mkdirSync(outDir, { recursive: true })

function sanitizeSegment(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "")
}

async function auditPage(page) {
  return page.evaluate(() => {
    const selector = [
      "a[href]",
      "button",
      "input:not([type=hidden])",
      "select",
      "textarea",
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="switch"]',
      '[role="tab"]',
    ].join(",")

    function describe(el) {
      return (
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        el.textContent ||
        el.getAttribute("href") ||
        el.tagName
      )
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 120)
    }

    return Array.from(document.querySelectorAll(selector))
      .map((el) => {
        const rect = el.getBoundingClientRect()
        const style = window.getComputedStyle(el)
        const visible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.pointerEvents !== "none"

        if (!visible || el.disabled || el.getAttribute("aria-hidden") === "true") {
          return null
        }

        const isSkipLink =
          el.getAttribute("href") === "#main-content" ||
          describe(el).toLowerCase() === "skip to main content"
        const isInlineTextLink =
          el.tagName.toLowerCase() === "a" &&
          !!el.closest("p, li") &&
          !el.querySelector("img, svg, picture")

        const width = Math.round(rect.width * 10) / 10
        const height = Math.round(rect.height * 10) / 10
        const failsSize = width < 44 || height < 44

        return {
          tag: el.tagName.toLowerCase(),
          label: describe(el),
          href: el.getAttribute("href") || "",
          width,
          height,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          classes: el.getAttribute("class") || "",
          isSkipLink,
          isInlineTextLink,
          failsSize,
        }
      })
      .filter(Boolean)
  })
}

async function auditMobileFilterBottomSheet(page) {
  const failures = []
  const trigger = page.getByRole("button", { name: /open filters/i }).first()

  try {
    await trigger.click({ timeout: 15_000 })
  } catch (err) {
    failures.push({
      check: "filter-trigger",
      message: "Could not open mobile filters",
      detail: err instanceof Error ? err.message : String(err),
    })
    return { name: "open-mobile-filters", failures }
  }

  const dialog = page.getByRole("dialog", { name: "Product filters" }).first()
  try {
    await dialog.waitFor({ state: "visible", timeout: 5_000 })
    await page.waitForTimeout(350)
  } catch (err) {
    failures.push({
      check: "filter-dialog",
      message: "Product filters dialog did not become visible",
      detail: err instanceof Error ? err.message : String(err),
    })
    return { name: "open-mobile-filters", failures }
  }

  const metrics = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Product filters"]')
    const closeButton = dialog?.querySelector('button[aria-label="Close filters"]')
    const actionButton = Array.from(dialog?.querySelectorAll("button") || []).find((button) =>
      /^show\s+\d+/i.test(button.textContent?.trim() || "")
    )
    const handle = dialog?.querySelector(".h-1.w-12")
    const rect = dialog?.getBoundingClientRect()
    const style = dialog ? window.getComputedStyle(dialog) : null
    const closeRect = closeButton?.getBoundingClientRect()
    const actionRect = actionButton?.getBoundingClientRect()

    return {
      foundDialog: Boolean(dialog && rect),
      foundHandle: Boolean(handle),
      bodyOverflow: document.body.style.overflow || window.getComputedStyle(document.body).overflow,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      rect: rect
        ? {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }
        : null,
      borderTopLeftRadius: style?.borderTopLeftRadius || "",
      borderTopRightRadius: style?.borderTopRightRadius || "",
      transform: style?.transform || "",
      closeButton: closeRect
        ? { width: closeRect.width, height: closeRect.height }
        : null,
      actionButton: actionRect
        ? { width: actionRect.width, height: actionRect.height }
        : null,
    }
  })

  if (!metrics.foundDialog || !metrics.rect) {
    failures.push({
      check: "filter-dialog",
      message: "Product filters dialog is missing from the DOM",
    })
    return { name: "open-mobile-filters", metrics, failures }
  }

  const radius = parseFloat(metrics.borderTopLeftRadius)
  const rightRadius = parseFloat(metrics.borderTopRightRadius)
  const bottomGap = Math.abs(metrics.viewportHeight - metrics.rect.bottom)

  if (Math.round(metrics.rect.left) !== 0 || Math.round(metrics.rect.width) < metrics.viewportWidth - 1) {
    failures.push({
      check: "sheet-width",
      message: "Filter sheet should span the full mobile viewport width",
      metrics,
    })
  }

  if (bottomGap > 2) {
    failures.push({
      check: "sheet-bottom",
      message: "Filter sheet should be anchored to the bottom of the viewport",
      metrics,
    })
  }

  if (metrics.rect.height > metrics.viewportHeight * 0.9) {
    failures.push({
      check: "sheet-height",
      message: "Filter sheet should leave page context visible above it",
      metrics,
    })
  }

  if (Number.isNaN(radius) || radius < 16 || Number.isNaN(rightRadius) || rightRadius < 16) {
    failures.push({
      check: "sheet-radius",
      message: "Filter sheet should use rounded top corners",
      metrics,
    })
  }

  if (!metrics.foundHandle) {
    failures.push({
      check: "sheet-handle",
      message: "Filter sheet should expose a drag-handle affordance",
      metrics,
    })
  }

  if (metrics.bodyOverflow !== "hidden") {
    failures.push({
      check: "body-scroll-lock",
      message: "Opening the filter sheet should lock body scroll",
      metrics,
    })
  }

  if (!metrics.closeButton || metrics.closeButton.width < 40 || metrics.closeButton.height < 40) {
    failures.push({
      check: "close-target",
      message: "Filter sheet close button should be thumb-sized",
      metrics,
    })
  }

  if (!metrics.actionButton || metrics.actionButton.height < 44) {
    failures.push({
      check: "action-target",
      message: "Filter sheet show-results action should be thumb-sized",
      metrics,
    })
  }

  return { name: "open-mobile-filters", metrics, failures }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const report = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    minimumCssPixels: 44,
    routes: [],
  }

  for (const viewport of viewports) {
    for (const route of routes) {
      const context = await browser.newContext({
        ...(viewport.device || {}),
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: true,
      })
      const page = await context.newPage()
      const url = `${baseUrl}${route.path}`
      const result = {
        route: route.path,
        name: route.name,
        viewport: viewport.name,
        url,
        failures: [],
        assertionFailures: [],
        interactions: [],
        warnings: [],
        targetCount: 0,
      }

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 })
        await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {})
        await page.waitForTimeout(500)
        const targets = await auditPage(page)
        result.targetCount = targets.length
        result.failures = targets.filter(
          (target) =>
            target.failsSize && !target.isSkipLink && !target.isInlineTextLink
        )
        result.warnings = targets.filter(
          (target) => target.failsSize && target.isInlineTextLink
        )

        if (takeScreenshots) {
          const fileName = `${viewport.name}-${sanitizeSegment(route.name)}.png`
          await page.screenshot({
            path: path.join(outDir, fileName),
            fullPage: true,
          })
          result.screenshot = path.join("test-results", "mobile-audit", fileName)
        }

        for (const interaction of route.interactions || []) {
          if (interaction === "open-mobile-filters") {
            const interactionResult = await auditMobileFilterBottomSheet(page)
            result.interactions.push(interactionResult)
            result.assertionFailures.push(...interactionResult.failures)
            if (takeScreenshots) {
              const fileName = `${viewport.name}-${sanitizeSegment(route.name)}-${interaction}.png`
              await page.screenshot({
                path: path.join(outDir, fileName),
                fullPage: true,
              })
              interactionResult.screenshot = path.join(
                "test-results",
                "mobile-audit",
                fileName
              )
            }
          }
        }
      } catch (err) {
        result.error = err instanceof Error ? err.message : String(err)
      } finally {
        report.routes.push(result)
        await context.close()
      }
    }
  }

  await browser.close()
  const reportPath = path.join(outDir, "report.json")
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  let totalFailures = 0
  let totalAssertionFailures = 0
  let totalWarnings = 0
  let totalErrors = 0
  for (const route of report.routes) {
    totalFailures += route.failures.length
    totalAssertionFailures += route.assertionFailures.length
    totalWarnings += route.warnings.length
    const label = `${route.viewport} ${route.route}`
    if (route.error) {
      totalErrors++
      console.log(`ERROR ${label}: ${route.error}`)
    } else {
      console.log(
        `${route.failures.length === 0 ? "OK" : "FAIL"} ${label}: ` +
          `${route.failures.length} target failure(s), ` +
          `${route.assertionFailures.length} assertion failure(s), ` +
          `${route.warnings.length} inline warning(s)`
      )
    }
    for (const failure of route.failures.slice(0, 8)) {
      console.log(
        `  - ${failure.width}x${failure.height} ${failure.tag} ${JSON.stringify(
          failure.label || failure.href
        )}`
      )
    }
    for (const failure of route.assertionFailures) {
      console.log(`  - assertion ${failure.check}: ${failure.message}`)
    }
  }

  console.log(`\nReport: ${reportPath}`)
  console.log(
    `Failures: ${totalFailures}; assertion failures: ${totalAssertionFailures}; ` +
      `route errors: ${totalErrors}; inline warnings: ${totalWarnings}`
  )

  if (
    failOnSmallTargets &&
    (totalFailures > 0 || totalAssertionFailures > 0 || totalErrors > 0)
  ) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
