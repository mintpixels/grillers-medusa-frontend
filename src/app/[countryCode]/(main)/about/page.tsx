import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function AboutRedirect({ params }: Props) {
  const { countryCode } = await params
  redirect(`/${countryCode}/page/about-us`)
}
