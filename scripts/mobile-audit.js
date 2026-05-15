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
    name: "pdp-ground-beef",
    path:
      "/us/products/1-lb-pack-ground-beef-8020-100-grass-fed-all-natural-no-hormones-no-antibiotics-uncooked-not-kosher-for-passover-1399pack",
  },
  { name: "cart", path: "/us/cart" },
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
  let totalWarnings = 0
  let totalErrors = 0
  for (const route of report.routes) {
    totalFailures += route.failures.length
    totalWarnings += route.warnings.length
    const label = `${route.viewport} ${route.route}`
    if (route.error) {
      totalErrors++
      console.log(`ERROR ${label}: ${route.error}`)
    } else {
      console.log(
        `${route.failures.length === 0 ? "OK" : "FAIL"} ${label}: ` +
          `${route.failures.length} target failure(s), ${route.warnings.length} inline warning(s)`
      )
    }
    for (const failure of route.failures.slice(0, 8)) {
      console.log(
        `  - ${failure.width}x${failure.height} ${failure.tag} ${JSON.stringify(
          failure.label || failure.href
        )}`
      )
    }
  }

  console.log(`\nReport: ${reportPath}`)
  console.log(
    `Failures: ${totalFailures}; route errors: ${totalErrors}; inline warnings: ${totalWarnings}`
  )

  if (failOnSmallTargets && (totalFailures > 0 || totalErrors > 0)) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
