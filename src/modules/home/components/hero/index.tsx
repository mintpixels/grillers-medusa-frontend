const Hero = ({
  data,
}: {
  data: {
    HeroTitle: string
    BackgroundImage: {
      url: string
    }
  }
}) => {
  return (
    <div
      className="h-[65vh] max-h-[673px] w-full bg-no-repeat bg-center bg-cover flex flex-col justify-center items-center"
      style={{
        backgroundImage: `url('${data?.BackgroundImage?.url}')`,
      }}
    >
      <div className="text-center small:p-32 gap-6">
        <div className="max-w-[820px]">
          <h1 className="text-white font-gyst text-h1-mobile md:text-h1">
            {data?.HeroTitle}
          </h1>
        </div>
      </div>
    </div>
  )
}

export default Hero
