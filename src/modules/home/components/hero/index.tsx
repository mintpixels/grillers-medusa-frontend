import Link from "next/link"

type HeroProps = {
  data: {
    HeroTitle: string
    BackgroundImage: {
      url: string
    }
    CTAButton?: {
      Text: string
      Url: string
    }
  }
}

const Hero = ({ data }: HeroProps) => {
  return (
    <section
      className="h-[65vh] max-h-[673px] w-full bg-no-repeat bg-center bg-cover flex flex-col justify-center items-center relative"
      role="img"
      aria-label="Hero banner featuring premium kosher meats"
      style={{
        backgroundImage: `url('${data?.BackgroundImage?.url}')`,
      }}
    >
      {/* Dark overlay for text contrast - ensures WCAG AA compliance */}
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="text-center small:p-32 gap-6 flex flex-col items-center relative z-10">
        <div className="max-w-[820px]">
          <h1 className="text-white font-gyst text-h1-mobile md:text-h1 drop-shadow-lg">
            {data?.HeroTitle}
          </h1>
        </div>
        {data?.CTAButton?.Text && data?.CTAButton?.Url && (
          <Link
            href={data.CTAButton.Url}
            className="mt-8 inline-block bg-Gold hover:bg-Gold/90 text-Charcoal font-maison-neue font-bold text-p-md px-8 py-4 rounded-[5px] uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-Gold focus:ring-offset-2 focus:ring-offset-black"
          >
            {data.CTAButton.Text}
          </Link>
        )}
      </div>
    </section>
  )
}

export default Hero
