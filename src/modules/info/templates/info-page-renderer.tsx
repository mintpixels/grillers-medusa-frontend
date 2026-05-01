import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BlocksRenderer } from "@strapi/blocks-react-renderer"
import type {
  InfoBodyComponent,
  InfoFeatureCard,
  InfoHero,
  StrapiLink,
  StrapiMedia,
} from "@lib/data/strapi/legal"

const richProse =
  "font-maison-neue text-Charcoal/90 [&_h2]:font-gyst [&_h2]:text-Charcoal [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-h3-mobile md:[&_h2]:text-h3 [&_h3]:font-gyst [&_h3]:text-Charcoal [&_h3]:mt-6 [&_h3]:mb-2 [&_a]:text-Gold [&_a:hover]:text-Gold/80 [&_strong]:text-Charcoal [&_blockquote]:border-l-4 [&_blockquote]:border-Gold/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-Charcoal/70 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_p]:my-5 [&_p]:leading-[1.7]"

function isInternal(url: string) {
  return url.startsWith("/")
}

function CtaButton({
  link,
  variant,
}: {
  link: StrapiLink
  variant: "primary" | "secondary"
}) {
  const base =
    "inline-flex items-center justify-center px-6 py-3 font-maison-neue font-semibold rounded-full transition-colors"
  const styles =
    variant === "primary"
      ? `${base} bg-Gold text-white hover:bg-Gold/90`
      : `${base} border border-Charcoal/20 text-Charcoal hover:bg-Charcoal/5`

  if (isInternal(link.Url)) {
    return (
      <LocalizedClientLink href={link.Url} className={styles}>
        {link.Text}
      </LocalizedClientLink>
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
  return (
    <section className="content-container pt-10 md:pt-16 pb-8 md:pb-12">
      <div
        className={`mx-auto max-w-6xl grid gap-10 md:gap-14 ${
          hasImage ? "md:grid-cols-2 items-center" : "max-w-3xl"
        }`}
      >
        <div>
          {hero.Eyebrow && (
            <p className="text-p-sm-mono font-maison-neue-mono uppercase tracking-[0.2em] text-Gold mb-3">
              {hero.Eyebrow}
            </p>
          )}
          <h1 className="text-h1-mobile md:text-h1 font-gyst text-Charcoal leading-tight">
            {hero.Headline}
          </h1>
          {hero.Subhead && (
            <p className="mt-5 text-p-lg font-maison-neue text-Charcoal/75 max-w-xl leading-[1.6]">
              {hero.Subhead}
            </p>
          )}
          {(hero.PrimaryCta || hero.SecondaryCta) && (
            <div className="mt-7 flex flex-wrap gap-3">
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
          <div className="relative aspect-[4/3] md:aspect-[5/4] rounded-2xl overflow-hidden bg-Charcoal/5">
            <Image
              src={hero.Image.url}
              alt={hero.ImageAlt || hero.Headline}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
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
}: {
  block: Extract<InfoBodyComponent, { __typename: "ComponentInfoSection" }>
}) {
  const pos = block.ImagePosition || "none"
  const hasImage = Boolean(block.Image?.url) && pos !== "none"

  if (hasImage && (pos === "left" || pos === "right")) {
    return (
      <section className="content-container my-12">
        <div
          className={`mx-auto max-w-6xl grid gap-10 md:grid-cols-2 items-center ${
            pos === "right" ? "md:[&>div:first-child]:order-2" : ""
          }`}
        >
          <div>
            {block.Title && (
              <h2 className="font-gyst text-Charcoal text-h3-mobile md:text-h3 mb-5">
                {block.Title}
              </h2>
            )}
            {block.Body && (
              <div className={richProse}>
                <BlocksRenderer content={block.Body as any} />
              </div>
            )}
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-Charcoal/5">
            <StrapiImage
              media={block.Image!}
              alt={block.ImageAlt || block.Title || ""}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="content-container my-10">
      <div className="mx-auto max-w-3xl">
        {block.Title && (
          <h2 className="font-gyst text-Charcoal text-h3-mobile md:text-h3 mb-5">
            {block.Title}
          </h2>
        )}
        {hasImage && pos === "full" && block.Image && (
          <div className="my-6 rounded-2xl overflow-hidden bg-Charcoal/5">
            <StrapiImage
              media={block.Image}
              alt={block.ImageAlt || block.Title || ""}
              sizes="(min-width: 768px) 768px, 100vw"
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        {block.Body && (
          <div className={richProse}>
            <BlocksRenderer content={block.Body as any} />
          </div>
        )}
      </div>
    </section>
  )
}

function FeatureGridBlock({
  block,
}: {
  block: Extract<InfoBodyComponent, { __typename: "ComponentInfoFeatureGrid" }>
}) {
  const cards: InfoFeatureCard[] = block.Cards || []
  if (!cards.length) return null
  const cols = cards.length === 1 ? 1 : cards.length === 2 ? 2 : 3

  return (
    <section className="content-container my-14">
      <div className="mx-auto max-w-6xl">
        {(block.Heading || block.Intro) && (
          <div className="text-center mb-10 max-w-2xl mx-auto">
            {block.Heading && (
              <h2 className="font-gyst text-Charcoal text-h3-mobile md:text-h3 mb-4">
                {block.Heading}
              </h2>
            )}
            {block.Intro && (
              <p className="font-maison-neue text-Charcoal/75 leading-[1.6]">
                {block.Intro}
              </p>
            )}
          </div>
        )}
        <div
          className={`grid gap-6 md:gap-8 ${
            cols === 1
              ? "grid-cols-1 max-w-md mx-auto"
              : cols === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              className="rounded-2xl border border-Charcoal/10 bg-white p-6 md:p-7"
            >
              {card.Icon?.url && (
                <div className="relative w-10 h-10 mb-4">
                  <Image
                    src={card.Icon.url}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
              )}
              <h3 className="font-gyst text-Charcoal text-lg mb-2">
                {card.Title}
              </h3>
              {card.Body && (
                <p className="font-maison-neue text-Charcoal/75 text-sm leading-[1.6]">
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
    <figure className={wide ? "my-10" : "content-container my-10"}>
      <div
        className={`${
          wide ? "" : "mx-auto max-w-4xl"
        } rounded-2xl overflow-hidden bg-Charcoal/5`}
      >
        <StrapiImage
          media={block.Image}
          alt={block.Alt}
          sizes={wide ? "100vw" : "(min-width: 1024px) 1024px, 100vw"}
          className="w-full h-auto object-cover"
        />
      </div>
      {block.Caption && (
        <figcaption className="mt-3 text-center font-maison-neue text-Charcoal/55 text-sm">
          {block.Caption}
        </figcaption>
      )}
    </figure>
  )
}

function RichTextBlock({
  block,
}: {
  block: Extract<InfoBodyComponent, { __typename: "ComponentSharedRichText" }>
}) {
  if (!block.body) return null
  return (
    <section className="content-container my-10">
      <div
        className={`mx-auto max-w-3xl ${richProse}`}
        dangerouslySetInnerHTML={{ __html: block.body }}
      />
    </section>
  )
}

export function StructuredInfoBody({
  body,
}: {
  body: InfoBodyComponent[]
}) {
  return (
    <>
      {body.map((block, i) => {
        switch (block.__typename) {
          case "ComponentInfoSection":
            return <SectionBlock key={i} block={block} />
          case "ComponentInfoFeatureGrid":
            return <FeatureGridBlock key={i} block={block} />
          case "ComponentInfoImageBlock":
            return <ImageBlockComponent key={i} block={block} />
          case "ComponentSharedRichText":
            return <RichTextBlock key={i} block={block} />
          default:
            return null
        }
      })}
    </>
  )
}

export { HeroBlock as StructuredInfoHero }
