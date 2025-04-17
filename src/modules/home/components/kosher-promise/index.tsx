import React from "react"
import Image from "next/image"

const KosherPromise = () => {
  return (
    <section className="pt-[70px] pb-[145px] md:pt-[55px] md:pb-[65px] bg-Charcoal overflow-hidden">
      <div className="flex flex-col items-center text-center max-w-[625px] mx-auto relative">
        <Image
          src={"/images/pages/home/KosherPromise.png"}
          width={69}
          height={79}
          alt="A Kosher Promise"
        />

        <h3 className="text-h3 text-Scroll pt-8 pb-7">A Kosher Promise</h3>

        <Image
          className="absolute -right-12 top-56 md:-right-24 md:top-32"
          src={"/images/pages/home/Badge_Seal.png"}
          width={131}
          height={133}
          alt="Badge"
        />

        <p className="text-h6 font-bold uppercase text-Scroll mb-8 z-[1] px-4.5 md:px-0">
          Etiam id nisi scelerisque, consequat diam eget, imperdiet urna.
          Aliquam erat volutpat. Aliquam sed nisl at sem molestie condimentum.
          Etiam id nisi scelerisque, consequat diam eget, imperdiet urna.
          Aliquam erat volutpat. Aliquam sed nisl at sem molestie condimentum.
        </p>

        <div className="flex items-center divide-x divide-Scroll border-y border-Scroll mb-12 z-[1]">
          <div className="flex-none md:flex-1 flex items-center pl-2 pr-8 uppercase text-white text-p-md-mono h-[58px]">
            First Cuts Selection
          </div>
          <div className="pl-6 pr-1 h-[58px] flex-1 md:flex-none relative">
            <Image
              className="relative top-3 size-full object-cover object-left md:size-auto"
              src={"/images/pages/home/Quality_is_our_guarantee.png"}
              width={370}
              height={45}
              alt="Quality is our guarantee"
            />
          </div>
        </div>

        <a href="#" className="btn-primary">
          <span className="text-h6 font-bold text-Charcoal uppercase">
            Learn More
          </span>
          <Image
            src={"/images/icons/arrow-right.svg"}
            width={20}
            height={12}
            alt="Shop Bestsellers"
          />
        </a>
      </div>
    </section>
  )
}

export default KosherPromise
