const Hero = () => {
  return (
    <div
      className="h-[65vh] max-h-[673px] w-full bg-no-repeat bg-center bg-cover flex flex-col justify-center items-center"
      style={{
        backgroundImage:
          "url('/images/pages/home/daveedi_86763_chef_holding_holding_plate_with_cooked_beef_with__27ca7625-54c2-493b-8445-ab117b3c9f80.jpg')",
      }}
    >
      <div className="text-center small:p-32 gap-6">
        <div className="max-w-[820px]">
          <h1 className="text-white  text-h1-mobile md:text-h1">
            Quality is the standard. Kosher is the promise.
          </h1>
        </div>
      </div>
    </div>
  )
}

export default Hero
