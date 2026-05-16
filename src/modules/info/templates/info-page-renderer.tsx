import Image from "next/image"
import { Fragment } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type {
  InfoBodyComponent,
  InfoFeatureCard,
  InfoHero,
  InfoTableColumn,
  StrapiLink,
  StrapiMedia,
} from "@lib/data/strapi/legal"
import type { InfoSupplementalData } from "./supplemental-modules"
import { SupplementalInfoModule } from "./supplemental-modules"

const richProse =
  "font-maison-neue text-Charcoal/90 [&_h2]:font-gyst [&_h2]:text-Charcoal [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-h3-mobile md:[&_h2]:text-h3 [&_h2]:text-balance [&_h3]:font-gyst [&_h3]:text-Charcoal [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:text-balance [&_a]:text-RichGold [&_a:hover]:text-RichGold/80 [&_strong]:text-Charcoal [&_blockquote]:border-l-4 [&_blockquote]:border-RichGold/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-Charcoal/70 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-2 [&_p]:my-5 [&_p]:leading-[1.68] [&_p]:text-pretty"

type RichTextChild = {
  type?: string
  text?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  url?: string
  children?: RichTextChild[]
}

type RichTextBlock = {
  type?: string
  level?: number
  format?: "ordered" | "unordered"
  children?: RichTextChild[]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function isInternalPath(url: string) {
  return url.startsWith("/")
}

// In-page (#anchor) or protocol links (mailto:, tel:, sms:, callto:) should
// render as plain anchors with no target="_blank". Opening a new browser
// window before the OS protocol-handler kicks in produces an empty stub tab
// and confuses screen readers about navigation context. (See #94 and Codex
// adversarial review.)
function isSameContextLink(url: string) {
  if (url.startsWith("#")) return true
  return /^(mailto:|tel:|sms:|callto:)/i.test(url)
}

function flattenInline(children?: RichTextChild[]): string {
  if (!children) return ""
  return children
    .map((child) => {
      if (child.type === "text") return child.text || ""
      return flattenInline(child.children)
    })
    .join("")
}

function shouldInsertInlineSpace(previous: string, current: string) {
  if (!previous || !current) return false
  if (/\s$/.test(previous) || /^\s/.test(current)) return false
  if (/^[,.;:!?%)]/.test(current)) return false
  if (/[(#$]$/.test(previous)) return false
  if (/[-/]$/.test(previous) || /^[-/]/.test(current)) return false
  return /[A-Za-z0-9)]$/.test(previous) && /^[A-Za-z0-9([]/.test(current)
}

function isImplementationPlaceholder(text: string) {
  const trimmed = text.trim()
  if (!/^\[[^\]]+\]\.?$/.test(trimmed)) return false
  return /(embedded|strapi-managed|email subscribe|subscribe form|placeholder|cta|table|calendar|list|form)/i.test(
    trimmed
  )
}

function isEditorInstructionText(text: string) {
  return /managed in Strapi|Strapi-managed|Strapi managed/i.test(text)
}

function sanitizeInlineText(text: string) {
  return text
    .replace(/"Available from \[date\]" note/g, "specific availability note")
    .replace(/\[([^\]]+)\]/g, (_, label: string) =>
      label.replace(/\s*→\s*$/g, "").trim()
    )
}

function renderTextWithMarkdownLinks(
  text: string,
  keyPrefix: string
): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(sanitizeInlineText(text.slice(lastIndex, match.index)))
    }
    const label = match[1].trim()
    const href = match[2].trim()
    const key = `${keyPrefix}.link-${match.index}`
    if (isInternalPath(href)) {
      parts.push(
        <LocalizedClientLink
          key={key}
          href={href}
          className="text-RichGold underline-offset-2 hover:underline"
        >
          {label}
        </LocalizedClientLink>
      )
    } else {
      parts.push(
        <a
          key={key}
          href={href}
          className="text-RichGold underline-offset-2 hover:underline"
          target={isSameContextLink(href) ? undefined : "_blank"}
          rel={isSameContextLink(href) ? undefined : "noopener noreferrer"}
        >
          {label}
        </a>
      )
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(sanitizeInlineText(text.slice(lastIndex)))
  }

  return parts
}

function renderInlineChild(
  child: RichTextChild,
  key: string
): { node: React.ReactNode; text: string } | null {
  if (child.type === "link") {
    const text = flattenInline(child.children)
    const inner = renderInlineChildren(child.children || [], `${key}.link`)
    const url = child.url || "#"
    if (isInternalPath(url)) {
      return {
        text,
        node: (
          <LocalizedClientLink
            key={key}
            href={url}
            className="text-RichGold underline-offset-2 hover:underline"
          >
            {inner}
          </LocalizedClientLink>
        ),
      }
    }
    return {
      text,
      node: (
        <a
          key={key}
          href={url}
          target={isSameContextLink(url) ? undefined : "_blank"}
          rel={isSameContextLink(url) ? undefined : "noopener noreferrer"}
          className="text-RichGold underline-offset-2 hover:underline"
        >
          {inner}
        </a>
      ),
    }
  }

  if (child.type !== "text") return null

  const text = child.text || ""
  if (!text) return { text, node: "" }

  let node: React.ReactNode = renderTextWithMarkdownLinks(text, key)
  if (child.bold) {
    node = (
      <strong key={key} className="font-semibold text-Charcoal">
        {node}
      </strong>
    )
  }
  if (child.italic) node = <em key={key}>{node}</em>
  if (child.underline)
    node = (
      <span key={key} className="underline">
        {node}
      </span>
    )

  return { text, node: <span key={key}>{node}</span> }
}

function renderInlineChildren(
  children: RichTextChild[],
  keyPrefix: string
): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let previousText = ""

  children.forEach((child, index) => {
    const rendered = renderInlineChild(child, `${keyPrefix}.${index}`)
    if (!rendered) return

    if (
      shouldInsertInlineSpace(previousText, rendered.text) &&
      nodes.length > 0
    ) {
      nodes.push(" ")
      previousText += " "
    }

    nodes.push(rendered.node)
    previousText += rendered.text
  })

  return nodes
}

function RichTextBlocks({ content }: { content: RichTextBlock[] }) {
  return (
    <>
      {content.map((block, index) => {
        const key = `rt-${index}`
        const text = flattenInline(block.children)

        if (block.type === "paragraph") {
          if (
            isImplementationPlaceholder(text) ||
            isEditorInstructionText(text)
          ) {
            return null
          }
          return (
            <p key={key}>{renderInlineChildren(block.children || [], key)}</p>
          )
        }

        if (block.type === "heading") {
          const level = Math.min(Math.max(Number(block.level) || 2, 2), 4)
          const Tag = `h${level}` as keyof JSX.IntrinsicElements
          return (
            <Tag key={key}>
              {renderInlineChildren(block.children || [], key)}
            </Tag>
          )
        }

        if (block.type === "list") {
          const ordered = block.format === "ordered"
          const Tag = ordered ? "ol" : "ul"
          return (
            <Tag key={key}>
              {(block.children || []).map((item, itemIndex) => (
                <li key={`${key}.${itemIndex}`}>
                  {renderInlineChildren(
                    item.children || [],
                    `${key}.${itemIndex}`
                  )}
                </li>
              ))}
            </Tag>
          )
        }

        if (block.type === "quote") {
          return (
            <blockquote key={key}>
              {renderInlineChildren(block.children || [], key)}
            </blockquote>
          )
        }

        return null
      })}
    </>
  )
}

function firstBoldText(block: RichTextBlock) {
  return (
    block.children?.find(
      (child) => child.type === "text" && child.bold && child.text
    )?.text || ""
  ).trim()
}

function textAfterFirstBold(block: RichTextBlock) {
  const children = block.children || []
  const firstBoldIndex = children.findIndex(
    (child) => child.type === "text" && child.bold && child.text
  )
  if (firstBoldIndex < 0) return flattenInline(children).trim()
  return flattenInline(children.slice(firstBoldIndex + 1)).trim()
}

type DeliveryRateRow = {
  zip: string
  day: string
  rate250: string
  rate150: string
  rate100: string
  rate50: string
  rate0: string
}

type ParsedDeliveryRates = {
  intro: RichTextBlock[]
  rows: DeliveryRateRow[]
  trailing: RichTextBlock[]
}

function parseDeliveryRates(
  content: RichTextBlock[]
): ParsedDeliveryRates | null {
  const headerIndex = content.findIndex(
    (block) =>
      block.type === "paragraph" &&
      firstBoldText(block).toLowerCase() === "zip code"
  )

  if (headerIndex < 0) return null

  const rows: DeliveryRateRow[] = []
  let index = headerIndex + 1

  for (; index < content.length; index++) {
    const block = content[index]
    const zip = firstBoldText(block)
    if (!/^\d{5}$/.test(zip)) break

    const parts = textAfterFirstBold(block)
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)

    if (parts.length < 6) break

    rows.push({
      zip,
      day: parts[0],
      rate250: parts[1],
      rate150: parts[2],
      rate100: parts[3],
      rate50: parts[4],
      rate0: parts[5],
    })
  }

  if (!rows.length) return null

  return {
    intro: content.slice(0, headerIndex),
    rows,
    trailing: content.slice(index),
  }
}

function DeliveryRatesTable({ rows }: { rows: DeliveryRateRow[] }) {
  const columns = [
    { key: "rate250", label: "$250+" },
    { key: "rate150", label: "$150-$249" },
    { key: "rate100", label: "$100-$149" },
    { key: "rate50", label: "$50-$99" },
    { key: "rate0", label: "$0-$49" },
  ] as const

  return (
    <div className="not-prose my-7">
      <div className="hidden overflow-x-auto border-t border-Charcoal/20 md:block">
        <table className="min-w-[760px] w-full border-collapse font-maison-neue text-left text-p-sm text-Charcoal">
          <thead>
            <tr className="border-b border-Charcoal/20">
              <th className="py-3 pr-4 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold">
                ZIP Code
              </th>
              <th className="py-3 pr-4 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold">
                Delivery Day
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="py-3 pr-4 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.zip} className="border-b border-Charcoal/15">
                <th className="py-3 pr-4 align-top font-semibold text-Charcoal">
                  {row.zip}
                </th>
                <td className="py-3 pr-4 align-top text-Charcoal/80">
                  {row.day}
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="py-3 pr-4 align-top text-Charcoal/80"
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <div key={row.zip} className="border-t border-Charcoal/20 pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-maison-neue text-p-md font-semibold text-Charcoal">
                {row.zip}
              </h3>
              <p className="font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.12em] text-RichGold">
                {row.day}
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-maison-neue text-p-sm">
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between gap-3">
                  <dt className="text-Charcoal/60">{column.label}</dt>
                  <dd className="font-semibold text-Charcoal">
                    {row[column.key]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}

type ShippingComparisonRow = {
  label: string
  ground: string
  overnight: string
}

type ParsedShippingComparison = {
  intro: RichTextBlock[]
  rows: ShippingComparisonRow[]
  trailing: RichTextBlock[]
}

function parseShippingComparison(
  content: RichTextBlock[]
): ParsedShippingComparison | null {
  const headerIndex = content.findIndex((block) => {
    const text = flattenInline(block.children).toLowerCase()
    return (
      block.type === "paragraph" &&
      text.includes("ground") &&
      text.includes("overnight")
    )
  })

  if (headerIndex < 0) return null

  const rows: ShippingComparisonRow[] = []
  let index = headerIndex + 1

  for (; index < content.length; index++) {
    const block = content[index]
    const label = firstBoldText(block)
    if (!label) break

    const parts = textAfterFirstBold(block)
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)

    if (parts.length !== 2) break
    rows.push({ label, ground: parts[0], overnight: parts[1] })
  }

  if (!rows.length) return null

  return {
    intro: content.slice(0, headerIndex),
    rows,
    trailing: content.slice(index),
  }
}

function ShippingComparisonTable({ rows }: { rows: ShippingComparisonRow[] }) {
  return (
    <div className="not-prose my-7">
      <div className="hidden overflow-x-auto border-t border-Charcoal/20 md:block">
        <table className="min-w-[640px] w-full border-collapse font-maison-neue text-left text-p-sm text-Charcoal">
          <thead>
            <tr className="border-b border-Charcoal/20">
              <th className="py-3 pr-4 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold">
                Decision Point
              </th>
              <th className="py-3 pr-4 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold">
                UPS Ground
              </th>
              <th className="py-3 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold">
                UPS Overnight
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-Charcoal/15">
                <th className="py-4 pr-4 align-top font-semibold text-Charcoal">
                  {row.label}
                </th>
                <td className="py-4 pr-4 align-top text-Charcoal/80">
                  {row.ground}
                </td>
                <td className="py-4 align-top text-Charcoal/80">
                  {row.overnight}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:hidden">
        {(["ground", "overnight"] as const).map((method) => (
          <section key={method} className="border-t border-Charcoal/20 pt-4">
            <h3 className="font-gyst text-h4 font-bold text-Charcoal">
              {method === "ground" ? "UPS Ground" : "UPS Overnight"}
            </h3>
            <dl className="mt-3 space-y-3 font-maison-neue text-p-sm">
              {rows.map((row) => (
                <div key={row.label}>
                  <dt className="font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.12em] text-RichGold">
                    {row.label}
                  </dt>
                  <dd className="mt-1 leading-[1.6] text-Charcoal/80">
                    {row[method]}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}

function renderSpecialSectionBody({
  title,
  content,
}: {
  title?: string | null
  content: RichTextBlock[]
}): React.ReactNode | null {
  if (title === "Delivery zip codes & rates") {
    const parsed = parseDeliveryRates(content)
    if (parsed) {
      return (
        <>
          {parsed.intro.length > 0 && (
            <div className={richProse}>
              <RichTextBlocks content={parsed.intro} />
            </div>
          )}
          <DeliveryRatesTable rows={parsed.rows} />
          {parsed.trailing.length > 0 && (
            <div className={richProse}>
              <RichTextBlocks content={parsed.trailing} />
            </div>
          )}
        </>
      )
    }
  }

  if (title === "Ground or Overnight?") {
    const parsed = parseShippingComparison(content)
    if (parsed) {
      return (
        <>
          {parsed.intro.length > 0 && (
            <div className={richProse}>
              <RichTextBlocks content={parsed.intro} />
            </div>
          )}
          <ShippingComparisonTable rows={parsed.rows} />
          {parsed.trailing.length > 0 && (
            <div className={richProse}>
              <RichTextBlocks content={parsed.trailing} />
            </div>
          )}
        </>
      )
    }
  }

  return null
}

function SectionBodyContent({
  block,
}: {
  block: Extract<InfoBodyComponent, { __typename: "ComponentInfoSection" }>
}) {
  if (!block.SectionBody) return null
  const content = block.SectionBody as RichTextBlock[]
  const special = renderSpecialSectionBody({
    title: block.SectionTitle,
    content,
  })
  if (special) return <>{special}</>
  return (
    <div className={richProse}>
      <RichTextBlocks content={content} />
    </div>
  )
}

function shouldDropRichTextBlock(block: RichTextBlock) {
  if (block.type !== "paragraph") return false
  const text = flattenInline(block.children)
  return isImplementationPlaceholder(text) || isEditorInstructionText(text)
}

function sanitizeInfoBody(body: InfoBodyComponent[]) {
  return body.map((block) => {
    if (
      block.__typename === "ComponentInfoSection" &&
      Array.isArray(block.SectionBody)
    ) {
      return {
        ...block,
        SectionBody: (block.SectionBody as RichTextBlock[]).filter(
          (richBlock) => !shouldDropRichTextBlock(richBlock)
        ),
      }
    }
    return block
  })
}

function CtaButton({
  link,
  variant,
}: {
  link: StrapiLink
  variant: "primary" | "secondary"
}) {
  const base =
    "inline-flex h-11 items-center justify-center border px-5 font-rexton text-h6 font-bold uppercase tracking-wide transition-colors"
  const styles =
    variant === "primary"
      ? `${base} border-Gold bg-Gold text-Charcoal hover:bg-RichGold`
      : `${base} border-Scroll/35 text-Scroll hover:border-Gold hover:text-Gold`

  if (isInternalPath(link.Url)) {
    return (
      <LocalizedClientLink href={link.Url} className={styles}>
        {link.Text}
      </LocalizedClientLink>
    )
  }
  if (isSameContextLink(link.Url)) {
    return (
      <a href={link.Url} className={styles}>
        {link.Text}
      </a>
    )
  }
  return (
    <a
      href={link.Url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles}
    >
      {link.Text}
    </a>
  )
}

function HeroBlock({ hero }: { hero: InfoHero }) {
  const hasImage = Boolean(hero.Image?.url)
  const shouldShowCaption =
    hero.Image?.name?.toLowerCase().includes("swerdlow-family") ||
    hero.Image?.url?.toLowerCase().includes("swerdlow_family")

  return (
    <section className="bg-Charcoal text-Scroll border-b border-Scroll/15">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div
          className={`grid gap-8 lg:gap-12 ${
            hasImage
              ? "lg:grid-cols-[minmax(0,0.78fr)_minmax(420px,1fr)] lg:items-center"
              : "max-w-4xl"
          }`}
        >
          <div className="max-w-[680px]">
            {hero.Eyebrow && (
              <p className="mb-4 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.18em] text-Gold">
                {hero.Eyebrow}
              </p>
            )}
            <h1 className="font-gyst text-h1-mobile leading-tight text-Scroll text-balance md:text-h1">
              {hero.Headline}
            </h1>
            {hero.Subhead && (
              <p className="mt-5 max-w-[620px] font-maison-neue text-p-md leading-[1.65] text-Scroll/85 md:text-p-lg text-pretty">
                {hero.Subhead}
              </p>
            )}
            {(hero.PrimaryCta || hero.SecondaryCta) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {hero.PrimaryCta && (
                  <CtaButton link={hero.PrimaryCta} variant="primary" />
                )}
                {hero.SecondaryCta && (
                  <CtaButton link={hero.SecondaryCta} variant="secondary" />
                )}
              </div>
            )}
          </div>
          {hasImage && hero.Image && (
            <figure className="m-0">
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-Scroll/20 bg-Black md:aspect-[16/10]">
                <Image
                  src={hero.Image.url}
                  alt={hero.ImageAlt || hero.Headline}
                  fill
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              {shouldShowCaption &&
                hero.ImageAlt &&
                hero.ImageAlt.trim() !== hero.Headline.trim() && (
                  <figcaption className="mt-3 border-b border-Scroll/20 pb-3 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.12em] text-Scroll/55">
                    {hero.ImageAlt}
                  </figcaption>
                )}
            </figure>
          )}
        </div>
      </div>
    </section>
  )
}

function StrapiImage({
  media,
  alt,
  className,
  sizes,
  priority,
}: {
  media: StrapiMedia
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
}) {
  return (
    <Image
      src={media.url}
      alt={alt}
      width={media.width || 1200}
      height={media.height || 800}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  )
}

function SectionBlock({
  block,
  anchorId,
}: {
  block: Extract<InfoBodyComponent, { __typename: "ComponentInfoSection" }>
  anchorId?: string
}) {
  const pos = block.ImagePosition || "none"
  const hasImage = Boolean(block.SectionImage?.url) && pos !== "none"

  if (hasImage && (pos === "left" || pos === "right")) {
    return (
      <section
        id={anchorId}
        className="scroll-mt-32 border-t border-Charcoal/20 py-8 md:py-10"
      >
        <div
          className={`grid gap-8 md:grid-cols-[minmax(0,0.88fr)_minmax(300px,0.72fr)] md:items-start ${
            pos === "right" ? "md:[&>div:first-child]:order-2" : ""
          }`}
        >
          <div>
            {block.SectionTitle && (
              <h2 className="mb-5 font-gyst text-h3-mobile text-Charcoal text-balance md:text-h3">
                {block.SectionTitle}
              </h2>
            )}
            {block.SectionBody && <SectionBodyContent block={block} />}
          </div>
          <div className="relative overflow-hidden border border-Charcoal/15 bg-Scroll">
            <StrapiImage
              media={block.SectionImage!}
              alt={block.ImageAlt || block.SectionTitle || ""}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="aspect-[4/3] h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id={anchorId}
      className="scroll-mt-32 border-t border-Charcoal/20 py-8 md:py-10"
    >
      <div>
        {block.SectionTitle && (
          <h2 className="mb-5 font-gyst text-h3-mobile text-Charcoal text-balance md:text-h3">
            {block.SectionTitle}
          </h2>
        )}
        {hasImage && pos === "full" && block.SectionImage && (
          <div className="my-6 overflow-hidden border border-Charcoal/15 bg-Scroll">
            <StrapiImage
              media={block.SectionImage}
              alt={block.ImageAlt || block.SectionTitle || ""}
              sizes="(min-width: 768px) 768px, 100vw"
              className="aspect-[16/9] h-auto w-full object-cover"
            />
          </div>
        )}
        {block.SectionBody && <SectionBodyContent block={block} />}
      </div>
    </section>
  )
}

function FeatureGridBlock({
  block,
  anchorId,
}: {
  block: Extract<InfoBodyComponent, { __typename: "ComponentInfoFeatureGrid" }>
  anchorId?: string
}) {
  const cards: InfoFeatureCard[] = block.Cards || []
  if (!cards.length) return null
  const cols = cards.length === 1 ? 1 : cards.length === 2 ? 2 : 3

  return (
    <section
      id={anchorId}
      className="scroll-mt-32 border-t border-Charcoal/20 py-8 md:py-10"
    >
      <div>
        {(block.Heading || block.Intro) && (
          <div className="mb-8 max-w-3xl">
            {block.Heading && (
              <h2 className="mb-4 font-gyst text-h3-mobile text-Charcoal text-balance md:text-h3">
                {block.Heading}
              </h2>
            )}
            {block.Intro && (
              <p className="font-maison-neue text-Charcoal/75 leading-[1.65]">
                {block.Intro}
              </p>
            )}
          </div>
        )}
        <div
          className={`grid border-t border-Charcoal/20 ${
            cols === 1
              ? "grid-cols-1"
              : cols === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
          }`}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              className="border-b border-Charcoal/20 py-5 sm:px-5 sm:odd:border-r xl:border-r xl:last:border-r-0"
            >
              {card.Icon?.url && (
                <div className="relative mb-4 size-9">
                  <Image
                    src={card.Icon.url}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
              )}
              <h3 className="mb-2 font-gyst text-h4 font-bold text-Charcoal">
                {card.Title}
              </h3>
              {card.Body && (
                <p className="font-maison-neue text-p-sm leading-[1.6] text-Charcoal/75">
                  {card.Body}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ImageBlockComponent({
  block,
}: {
  block: Extract<InfoBodyComponent, { __typename: "ComponentInfoImageBlock" }>
}) {
  const wide = block.Width === "full"
  return (
    <figure className={wide ? "my-8" : "my-8"}>
      <div className="overflow-hidden border border-Charcoal/15 bg-Scroll">
        <StrapiImage
          media={block.BlockImage}
          alt={block.Alt}
          sizes={wide ? "100vw" : "(min-width: 1024px) 1024px, 100vw"}
          className="h-auto w-full object-cover"
        />
      </div>
      {block.Caption && (
        <figcaption className="mt-3 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.12em] text-Charcoal/50">
          {block.Caption}
        </figcaption>
      )}
    </figure>
  )
}

function RichTextBlock({
  block,
  anchorId,
}: {
  block: Extract<InfoBodyComponent, { __typename: "ComponentSharedRichText" }>
  anchorId?: string
}) {
  if (!block.body) return null
  return (
    <section
      id={anchorId}
      className="scroll-mt-32 border-t border-Charcoal/20 py-8 md:py-10"
    >
      <div
        className={`${richProse}`}
        dangerouslySetInnerHTML={{ __html: block.body }}
      />
    </section>
  )
}

function TableValue({ value }: { value: unknown }) {
  if (value == null || value === "") return <span className="text-Charcoal/35">-</span>
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>
  return <>{String(value)}</>
}

function alignmentClass(alignment?: InfoTableColumn["Alignment"]) {
  if (alignment === "center") return "text-center"
  if (alignment === "right") return "text-right"
  return "text-left"
}

function TableBlockComponent({
  block,
  anchorId,
}: {
  block: Extract<InfoBodyComponent, { __typename: "ComponentInfoTableBlock" }>
  anchorId?: string
}) {
  const columns = block.Columns || []
  const rows = block.Rows || []
  if (!columns.length || !rows.length) return null

  return (
    <section
      id={anchorId}
      className="scroll-mt-32 border-t border-Charcoal/20 py-8 md:py-10"
    >
      {(block.Heading || block.Intro) && (
        <div className="mb-6 max-w-3xl">
          {block.Heading && (
            <h2 className="mb-3 font-gyst text-h3-mobile text-Charcoal text-balance md:text-h3">
              {block.Heading}
            </h2>
          )}
          {block.Intro && (
            <p className="font-maison-neue text-p-sm leading-[1.65] text-Charcoal/75 md:text-p-md">
              {block.Intro}
            </p>
          )}
        </div>
      )}

      <div className="hidden overflow-hidden border border-Charcoal/20 md:block">
        <table className="w-full border-collapse font-maison-neue text-sm">
          <thead className="bg-Scroll">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.Key}
                  className={`border-b border-Charcoal/20 px-4 py-3 font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal/65 ${alignmentClass(column.Alignment)}`}
                >
                  {column.Label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.Label || rowIndex} className="border-b border-Charcoal/10 last:border-b-0">
                {columns.map((column) => (
                  <td
                    key={column.Key}
                    className={`px-4 py-4 leading-relaxed text-Charcoal/80 ${column.IsPrimary ? "font-semibold text-Charcoal" : ""} ${alignmentClass(column.Alignment)}`}
                  >
                    <TableValue value={row.Cells?.[column.Key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row, rowIndex) => {
          const primaryColumn = columns.find((column) => column.IsPrimary) || columns[0]
          return (
            <div
              key={row.Label || rowIndex}
              className="rounded-[5px] border border-Charcoal/15 bg-white p-4"
            >
              <h3 className="font-maison-neue text-sm font-semibold text-Charcoal">
                <TableValue value={row.Label || row.Cells?.[primaryColumn.Key]} />
              </h3>
              <dl className="mt-3 space-y-2">
                {columns
                  .filter((column) => column.Key !== primaryColumn.Key)
                  .map((column) => (
                    <div key={column.Key} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
                      <dt className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-RichGold">
                        {column.Label}
                      </dt>
                      <dd className="font-maison-neue text-sm leading-snug text-Charcoal/75">
                        <TableValue value={row.Cells?.[column.Key]} />
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          )
        })}
      </div>

      {block.Caption && (
        <p className="mt-3 font-maison-neue text-xs leading-relaxed text-Charcoal/55">
          {block.Caption}
        </p>
      )}
    </section>
  )
}

function ComparisonTableBlock({
  block,
  anchorId,
}: {
  block: Extract<InfoBodyComponent, { __typename: "ComponentInfoComparisonTable" }>
  anchorId?: string
}) {
  const rows = block.Rows || []
  if (!rows.length) return null

  return (
    <section
      id={anchorId}
      className="scroll-mt-32 border-t border-Charcoal/20 py-8 md:py-10"
    >
      {(block.Heading || block.Intro) && (
        <div className="mb-6 max-w-3xl">
          {block.Heading && (
            <h2 className="mb-3 font-gyst text-h3-mobile text-Charcoal text-balance md:text-h3">
              {block.Heading}
            </h2>
          )}
          {block.Intro && (
            <p className="font-maison-neue text-p-sm leading-[1.65] text-Charcoal/75 md:text-p-md">
              {block.Intro}
            </p>
          )}
        </div>
      )}

      <div className="hidden overflow-hidden border border-Charcoal/20 md:block">
        <table className="w-full border-collapse font-maison-neue text-sm">
          <thead className="bg-Scroll">
            <tr>
              <th className="border-b border-Charcoal/20 px-4 py-3 text-left font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal/65">
                {block.DecisionLabel}
              </th>
              <th className="border-b border-Charcoal/20 px-4 py-3 text-left font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal/65">
                {block.LeftOptionLabel}
              </th>
              <th className="border-b border-Charcoal/20 px-4 py-3 text-left font-maison-neue-mono text-[11px] font-bold uppercase tracking-wide text-Charcoal/65">
                {block.RightOptionLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.Label} className="border-b border-Charcoal/10 last:border-b-0">
                <th className="px-4 py-4 text-left font-semibold leading-relaxed text-Charcoal">
                  {row.Label}
                </th>
                <td className="px-4 py-4 leading-relaxed text-Charcoal/75">
                  {row.LeftValue}
                </td>
                <td className="px-4 py-4 leading-relaxed text-Charcoal/75">
                  {row.RightValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <div
            key={row.Label}
            className="rounded-[5px] border border-Charcoal/15 bg-white p-4"
          >
            <h3 className="font-maison-neue text-sm font-semibold text-Charcoal">
              {row.Label}
            </h3>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-RichGold">
                  {block.LeftOptionLabel}
                </dt>
                <dd className="mt-1 font-maison-neue text-sm leading-relaxed text-Charcoal/75">
                  {row.LeftValue}
                </dd>
              </div>
              <div>
                <dt className="font-maison-neue-mono text-[10px] font-bold uppercase tracking-wide text-RichGold">
                  {block.RightOptionLabel}
                </dt>
                <dd className="mt-1 font-maison-neue text-sm leading-relaxed text-Charcoal/75">
                  {row.RightValue}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {block.Caption && (
        <p className="mt-3 font-maison-neue text-xs leading-relaxed text-Charcoal/55">
          {block.Caption}
        </p>
      )}
    </section>
  )
}

export function StructuredInfoBody({
  body,
  pageSlug,
  supplementalData,
}: {
  body: InfoBodyComponent[]
  pageSlug?: string
  supplementalData?: InfoSupplementalData
}) {
  const sanitizedBody = sanitizeInfoBody(body)
  const navItems = sanitizedBody
    .map((block) => {
      if (block.__typename === "ComponentInfoSection" && block.SectionTitle) {
        return { label: block.SectionTitle, id: slugify(block.SectionTitle) }
      }
      if (block.__typename === "ComponentInfoFeatureGrid" && block.Heading) {
        return { label: block.Heading, id: slugify(block.Heading) }
      }
      if (
        (block.__typename === "ComponentInfoTableBlock" ||
          block.__typename === "ComponentInfoComparisonTable") &&
        block.Heading
      ) {
        return { label: block.Heading, id: slugify(block.Heading) }
      }
      return null
    })
    .filter(Boolean) as { label: string; id: string }[]

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-16 pt-8 md:pb-24 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
      <aside className="hidden lg:block">
        <div className="sticky top-28 border-t border-Charcoal/20 pt-5">
          <p className="mb-4 font-maison-neue-mono text-p-ex-sm-mono uppercase tracking-[0.14em] text-RichGold">
            On this page
          </p>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="border-b border-Charcoal/10 py-2 font-maison-neue text-p-sm leading-snug text-Charcoal/70 transition-colors hover:text-Charcoal"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        {sanitizedBody.map((block, i) => {
          const anchorId =
            block.__typename === "ComponentInfoSection" && block.SectionTitle
              ? slugify(block.SectionTitle)
              : block.__typename === "ComponentInfoFeatureGrid" && block.Heading
              ? slugify(block.Heading)
              : (block.__typename === "ComponentInfoTableBlock" ||
                  block.__typename === "ComponentInfoComparisonTable") &&
                block.Heading
              ? slugify(block.Heading)
              : undefined

          let rendered: React.ReactNode

          switch (block.__typename) {
            case "ComponentInfoSection":
              rendered = <SectionBlock block={block} anchorId={anchorId} />
              break
            case "ComponentInfoFeatureGrid":
              rendered = <FeatureGridBlock block={block} anchorId={anchorId} />
              break
            case "ComponentInfoImageBlock":
              rendered = <ImageBlockComponent block={block} />
              break
            case "ComponentSharedRichText":
              rendered = <RichTextBlock block={block} anchorId={anchorId} />
              break
            case "ComponentInfoTableBlock":
              rendered = <TableBlockComponent block={block} anchorId={anchorId} />
              break
            case "ComponentInfoComparisonTable":
              rendered = <ComparisonTableBlock block={block} anchorId={anchorId} />
              break
            default:
              rendered = null
          }

          return (
            <Fragment key={i}>
              {rendered}
              {pageSlug && (
                <SupplementalInfoModule
                  pageSlug={pageSlug}
                  anchorId={anchorId}
                  data={supplementalData}
                />
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

export { HeroBlock as StructuredInfoHero }
