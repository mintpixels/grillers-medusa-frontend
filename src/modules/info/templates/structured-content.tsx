"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useMemo } from "react"

/**
 * Footer / info pages are authored in Strapi as a single rich-text Content
 * blob using a markdown-spec dialect. The default BlocksRenderer would dump
 * label literals like "Eyebrow:", "Headline:", "Subhead:", "Primary CTA:",
 * "Image:" verbatim — see #71.
 *
 * This component pre-parses the blocks once and renders proper design
 * elements:
 *   - Hero with eyebrow + headline + subhead + CTAs
 *   - Sections with H2 titles and well-spaced body paragraphs
 *   - "Image: <url>" lines turn into responsive images
 *   - Bold-leading paragraphs render as feature cards in 1/2/3-up grids
 */

type Block = any
type AnyChild = {
  type: string
  text?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  url?: string
  children?: AnyChild[]
}

const HERO_HEADING_NAMES = new Set([
  "Hero",
  "Hero Section",
  "Hero section",
  "HERO",
])

const FIELD_LABELS: Array<
  [RegExp, "eyebrow" | "headline" | "subhead" | "primaryCta" | "secondaryCta" | "image"]
> = [
  [/^eyebrow\s*:\s*/i, "eyebrow"],
  [/^headline\s*:\s*/i, "headline"],
  [/^subhead\s*:\s*/i, "subhead"],
  [/^sub-?head(line)?\s*:\s*/i, "subhead"],
  [/^primary cta\s*:\s*/i, "primaryCta"],
  [/^secondary cta\s*:\s*/i, "secondaryCta"],
  [/^cta\s*:\s*/i, "primaryCta"],
  [/^image\s*:\s*/i, "image"],
]

const flattenText = (children: AnyChild[] | undefined): string => {
  if (!children) return ""
  return children
    .map((c) => {
      if (c.type === "text") return c.text || ""
      if (c.type === "link") return flattenText(c.children)
      return flattenText(c.children)
    })
    .join("")
}

const matchFieldLabel = (text: string): { field: string; rest: string } | null => {
  for (const [re, field] of FIELD_LABELS) {
    const m = text.match(re)
    if (m) return { field, rest: text.slice(m[0].length).trim() }
  }
  return null
}

// Parse a CTA line into label + URL.
const parseCta = (raw: string): { label: string; href?: string } => {
  const linkMatch = raw.match(/\(\s*(?:link|url)\s*:\s*([^)]+)\)/i)
  if (linkMatch) {
    return {
      label: raw.replace(linkMatch[0], "").replace(/[—→\-]+\s*$/, "").trim(),
      href: linkMatch[1].trim(),
    }
  }
  const parts = raw.split(/\s+[—→\-]+\s+/)
  if (parts.length >= 2 && /^(\/|https?:)/.test(parts[parts.length - 1])) {
    const href = parts.pop()!
    return { label: parts.join(" — ").trim(), href }
  }
  return { label: raw.trim() }
}

// Pull "Image: <url> | <alt>" or "Image: <url>" out of a paragraph
const parseImageLine = (raw: string): { src: string; alt?: string } | null => {
  if (!raw) return null
  const parts = raw.split("|").map((p) => p.trim())
  const src = parts[0]
  if (!src) return null
  if (!/^(https?:|\/)/.test(src)) return null
  return { src, alt: parts[1] }
}

type HeroData = {
  eyebrow?: string
  headline?: string
  subhead?: string
  primaryCta?: { label: string; href?: string }
  secondaryCta?: { label: string; href?: string }
  image?: { src: string; alt?: string }
}

type Section = {
  title: string
  blocks: Block[]
}

const isHeroHeading = (block: Block): boolean => {
  if (block?.type !== "heading") return false
  const text = flattenText(block.children).trim()
  return HERO_HEADING_NAMES.has(text)
}

// Render a single rich-text child (text run, link, etc.) preserving inline marks.
const renderChild = (child: AnyChild, key: string): React.ReactNode => {
  if (child.type === "link") {
    const inner = (child.children || []).map((c, i) => renderChild(c, `${key}.${i}`))
    const isExternal = child.url && /^https?:/.test(child.url)
    if (isExternal) {
      return (
        <a
          key={key}
          href={child.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-Gold hover:text-Gold/80 underline-offset-2 hover:underline"
        >
          {inner}
        </a>
      )
    }
    return (
      <LocalizedClientLink
        key={key}
        href={child.url || "#"}
        className="text-Gold hover:text-Gold/80 underline-offset-2 hover:underline"
      >
        {inner}
      </LocalizedClientLink>
    )
  }
  if (child.type === "text") {
    let node: React.ReactNode = child.text || ""
    if (child.bold) node = <strong className="text-Charcoal font-semibold">{node}</strong>
    if (child.italic) node = <em>{node}</em>
    if (child.underline) node = <span className="underline">{node}</span>
    return <span key={key}>{node}</span>
  }
  return null
}

const renderInline = (children: AnyChild[] | undefined, keyPrefix: string): React.ReactNode => {
  if (!children) return null
  return children.map((c, i) => renderChild(c, `${keyPrefix}.${i}`))
}

// Detect bold-leading paragraphs in a section: a paragraph whose first
// child run is bold and ends with ". " or "—" or "•" — render the section
// as a feature grid instead of plain paragraphs.
const detectFeaturePattern = (blocks: Block[]): { lead: string; body: AnyChild[] }[] | null => {
  const features: { lead: string; body: AnyChild[] }[] = []
  for (const b of blocks) {
    if (b?.type !== "paragraph") return null
    const children: AnyChild[] = b.children || []
    if (children.length < 2) return null
    const first = children[0]
    if (first.type !== "text" || !first.bold) return null
    const fullText = flattenText(children)
    const m = fullText.match(/^([^.]+\.)\s*(.*)$/s)
    if (!m) return null
    features.push({
      lead: m[1].trim(),
      body: children.slice(1),
    })
  }
  return features.length >= 2 ? features : null
}

const Hero: React.FC<{ data: HeroData }> = ({ data }) => {
  if (!data.eyebrow && !data.headline && !data.subhead && !data.image) return null
  return (
    <section className="not-prose mb-14 pb-12 border-b border-Charcoal/10">
      {data.image && (
        <figure className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-lg bg-Scroll/40 mb-10">
          <Image
            src={data.image.src}
            alt={data.image.alt || data.headline || ""}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </figure>
      )}
      {data.eyebrow && (
        <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-[0.25em] text-Gold mb-5">
          {data.eyebrow}
        </p>
      )}
      {data.headline && (
        <h2 className="text-h2-mobile md:text-h2 font-gyst text-Charcoal leading-tight mb-5">
          {data.headline}
        </h2>
      )}
      {data.subhead && (
        <p className="text-p-md md:text-p-lg font-maison-neue text-Charcoal/75 leading-relaxed">
          {data.subhead}
        </p>
      )}
      {(data.primaryCta || data.secondaryCta) && (
        <div className="mt-8 flex flex-wrap gap-3">
          {data.primaryCta && <CtaButton cta={data.primaryCta} variant="primary" />}
          {data.secondaryCta && <CtaButton cta={data.secondaryCta} variant="secondary" />}
        </div>
      )}
    </section>
  )
}

const CtaButton: React.FC<{
  cta: { label: string; href?: string }
  variant: "primary" | "secondary"
}> = ({ cta, variant }) => {
  const className =
    variant === "primary"
      ? "inline-flex items-center gap-2 px-6 py-3 rounded-md bg-Gold text-Charcoal font-rexton text-sm font-bold uppercase tracking-wide hover:bg-Gold/90 transition-colors"
      : "inline-flex items-center gap-2 px-6 py-3 rounded-md border border-Charcoal/20 text-Charcoal font-rexton text-sm font-bold uppercase tracking-wide hover:border-Gold hover:text-Gold transition-colors"
  if (!cta.href) return <span className={className}>{cta.label}</span>
  const isExternal = /^https?:/.test(cta.href)
  if (isExternal) {
    return (
      <a href={cta.href} className={className} target="_blank" rel="noopener noreferrer">
        {cta.label} →
      </a>
    )
  }
  return (
    <LocalizedClientLink href={cta.href} className={className}>
      {cta.label} →
    </LocalizedClientLink>
  )
}

// Render a single section's body blocks with proper spacing.
const renderBlocks = (
  blocks: Block[],
  keyPrefix: string,
  options?: { dropImageLines?: boolean }
): { nodes: React.ReactNode[]; pulledImages: { src: string; alt?: string }[] } => {
  const nodes: React.ReactNode[] = []
  const pulledImages: { src: string; alt?: string }[] = []

  blocks.forEach((b, i) => {
    const k = `${keyPrefix}.${i}`
    if (b?.type === "paragraph") {
      const text = flattenText(b.children).trim()
      const m = matchFieldLabel(text)
      if (m && m.field === "image") {
        const img = parseImageLine(m.rest)
        if (img) {
          pulledImages.push(img)
          if (!options?.dropImageLines) {
            nodes.push(
              <figure
                key={k}
                className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-Scroll/40 my-8"
              >
                <Image
                  src={img.src}
                  alt={img.alt || ""}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                />
              </figure>
            )
          }
          return
        }
      }
      // Skip stray field labels that didn't fit a hero (e.g. orphaned
      // "Eyebrow:") so we never render those literals to customers.
      if (m && (m.field === "eyebrow" || m.field === "headline" || m.field === "subhead")) {
        return
      }
      if (m && (m.field === "primaryCta" || m.field === "secondaryCta")) {
        const cta = parseCta(m.rest)
        nodes.push(
          <div key={k} className="my-6">
            <CtaButton cta={cta} variant={m.field === "primaryCta" ? "primary" : "secondary"} />
          </div>
        )
        return
      }
      nodes.push(
        <p
          key={k}
          className="text-p-md font-maison-neue text-Charcoal/85 leading-[1.7] my-5"
        >
          {renderInline(b.children, k)}
        </p>
      )
      return
    }
    if (b?.type === "heading") {
      const level = Math.min(Math.max(Number(b.level) || 2, 2), 4)
      const className =
        level === 2
          ? "font-gyst text-Charcoal text-h3-mobile md:text-h3 mt-12 mb-5"
          : level === 3
            ? "font-gyst text-Charcoal text-h4-mobile md:text-h4 mt-8 mb-3"
            : "font-gyst text-Charcoal text-h5 mt-6 mb-2"
      const Tag = `h${level}` as any
      nodes.push(
        <Tag key={k} className={className}>
          {renderInline(b.children, k)}
        </Tag>
      )
      return
    }
    if (b?.type === "list") {
      const isOrdered = b.format === "ordered"
      const ListTag = isOrdered ? "ol" : "ul"
      const className = isOrdered
        ? "list-decimal pl-6 space-y-2 my-6 text-Charcoal/85 font-maison-neue marker:text-Gold"
        : "list-disc pl-6 space-y-2 my-6 text-Charcoal/85 font-maison-neue marker:text-Gold"
      nodes.push(
        <ListTag key={k} className={className}>
          {(b.children || []).map((li: any, j: number) => (
            <li key={`${k}.${j}`} className="leading-[1.7]">
              {renderInline(li.children, `${k}.${j}`)}
            </li>
          ))}
        </ListTag>
      )
      return
    }
    if (b?.type === "quote") {
      nodes.push(
        <blockquote
          key={k}
          className="border-l-4 border-Gold/40 pl-5 my-8 italic text-Charcoal/75 font-maison-neue"
        >
          {renderInline(b.children, k)}
        </blockquote>
      )
      return
    }
    if (b?.type === "code") {
      nodes.push(
        <pre
          key={k}
          className="bg-Scroll/60 rounded-md p-4 my-6 overflow-x-auto text-sm font-maison-neue-mono"
        >
          <code>{renderInline(b.children, k)}</code>
        </pre>
      )
      return
    }
  })

  return { nodes, pulledImages }
}

// Render a section. If it matches a feature pattern (multiple bold-led paragraphs)
// render as a 2/3-up grid of feature cards.
const SectionView: React.FC<{ section: Section; idx: number }> = ({ section, idx }) => {
  const features = useMemo(() => detectFeaturePattern(section.blocks), [section.blocks])

  if (features) {
    return (
      <section className="my-12">
        <h2 className="font-gyst text-Charcoal text-h3-mobile md:text-h3 mb-8">{section.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-Charcoal/10 bg-Scroll/30 p-6 hover:border-Gold/50 transition-colors"
            >
              <h3 className="font-gyst font-bold text-Charcoal text-p-lg leading-snug mb-3">
                {f.lead}
              </h3>
              <p className="text-p-sm font-maison-neue text-Charcoal/75 leading-[1.65]">
                {renderInline(f.body, `feat-${idx}-${i}`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const { nodes } = renderBlocks(section.blocks, `sec-${idx}`)
  return (
    <section className="my-10">
      <h2 className="font-gyst text-Charcoal text-h3-mobile md:text-h3 mt-2 mb-6">
        {section.title}
      </h2>
      {nodes}
    </section>
  )
}

const splitIntoSections = (blocks: Block[]): { intro: Block[]; sections: Section[] } => {
  const sections: Section[] = []
  let intro: Block[] = []
  let current: Section | null = null

  for (const b of blocks) {
    if (b?.type === "heading" && (b.level === 2 || !b.level)) {
      if (current) sections.push(current)
      current = { title: flattenText(b.children).trim(), blocks: [] }
      continue
    }
    if (current) {
      current.blocks.push(b)
    } else {
      intro.push(b)
    }
  }
  if (current) sections.push(current)
  return { intro, sections }
}

type Parsed = {
  hero?: HeroData
  intro: Block[]
  sections: Section[]
}

const parseContent = (blocks: Block[]): Parsed => {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { intro: [], sections: [] }
  }

  let i = 0
  let hero: HeroData | undefined

  // Detect hero at the top: either a "Hero" heading followed by Eyebrow/Headline/Subhead,
  // OR Eyebrow/Headline/Subhead/Image lines starting at index 0.
  if (isHeroHeading(blocks[0])) i = 1

  const heroFields = new Set([
    "eyebrow",
    "headline",
    "subhead",
    "primaryCta",
    "secondaryCta",
    "image",
  ])
  let consumed = 0
  const draft: HeroData = {}
  for (let j = i; j < blocks.length; j++) {
    const b = blocks[j]
    if (b?.type !== "paragraph") break
    const text = flattenText(b.children).trim()
    if (!text) {
      consumed++
      continue
    }
    const m = matchFieldLabel(text)
    if (!m || !heroFields.has(m.field)) break
    if (m.field === "eyebrow") draft.eyebrow = m.rest
    else if (m.field === "headline") draft.headline = m.rest
    else if (m.field === "subhead") draft.subhead = m.rest
    else if (m.field === "primaryCta") draft.primaryCta = parseCta(m.rest)
    else if (m.field === "secondaryCta") draft.secondaryCta = parseCta(m.rest)
    else if (m.field === "image") {
      const img = parseImageLine(m.rest)
      if (img) draft.image = img
    }
    consumed++
  }
  if (draft.eyebrow || draft.headline || draft.subhead || draft.image) {
    hero = draft
    i += consumed
  }

  const remaining = blocks.slice(i)
  const { intro, sections } = splitIntoSections(remaining)
  return { hero, intro, sections }
}

export const StructuredInfoContent: React.FC<{ content: Block[] | null | undefined }> = ({
  content,
}) => {
  const parsed = useMemo(() => parseContent(content as Block[]), [content])

  return (
    <div className="info-page-content">
      {parsed.hero && <Hero data={parsed.hero} />}
      {parsed.intro.length > 0 && (
        <div className="mb-6">{renderBlocks(parsed.intro, "intro").nodes}</div>
      )}
      {parsed.sections.map((s, i) => (
        <SectionView key={i} section={s} idx={i} />
      ))}
    </div>
  )
}
