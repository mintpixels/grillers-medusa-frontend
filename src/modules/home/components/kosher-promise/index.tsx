import React from "react"
import Image from "next/image"
import { BlocksRenderer } from "@strapi/blocks-react-renderer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
const KosherPromise = ({
  data,
}: {
  data: {
    KosherPromiseTitle: string
    Content: any
    Badge: {
      url: string
    }
    TopLogo: {
      url: string
    }
    FeatureText: string
    FeatureImage: { url: string }
    Link: {
      Text: string
      Url: string
    }
  }
}) => {
  return (
    <section className="pt-[70px] pb-[145px] md:pt-[55px] md:pb-[65px] bg-Charcoal overflow-hidden">
      <div className="flex flex-col items-center text-center max-w-[625px] mx-auto relative">
        {data?.TopLogo?.url && (
          <Image
            src={data.TopLogo.url}
            width={69}
            height={79}
            alt={data?.KosherPromiseTitle}
          />
        )}

        <h3 className="text-h3 text-Scroll pt-8 pb-7">
          {data?.KosherPromiseTitle}
        </h3>

        {data?.Badge?.url && (
          <Image
            className="absolute -right-12 top-56 md:-right-24 md:top-32"
            src={data.Badge.url}
            width={131}
            height={133}
            alt="Badge"
          />
        )}

        {data?.Content && (
          <div className="text-h6 font-bold uppercase text-Scroll mb-8 z-[1] px-4.5 md:px-0">
            <BlocksRenderer content={data.Content} />
          </div>
        )}

        <div className="flex items-center divide-x divide-Scroll border-y border-Scroll mb-12 z-[1]">
          {data?.FeatureText && (
            <div className="flex-none md:flex-1 flex items-center pl-2 pr-8 uppercase text-white text-p-md-mono h-[58px]">
              {data.FeatureText}
            </div>
          )}
          {data?.FeatureImage?.url && (
            <div className="pl-6 pr-1 h-[58px] flex-1 md:flex-none relative">
              <Image
                className="relative top-3 size-full object-cover object-left md:size-auto"
                src={data.FeatureImage.url}
                width={370}
                height={45}
                alt="image"
              />
            </div>
          )}
        </div>

        {data?.Link?.Url && data?.Link?.Text && (
          <LocalizedClientLink href={data.Link.Url} className="btn-primary">
            <span className="text-h6 font-bold text-Charcoal uppercase">
              {data.Link.Text}
            </span>
            <Image
              src={"/images/icons/arrow-right.svg"}
              width={20}
              height={12}
              alt={data.Link.Text}
            />
          </LocalizedClientLink>
        )}
      </div>
    </section>
  )
}

export default KosherPromise
