import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function MissionRedirect({ params }: Props) {
  const { countryCode } = await params
  redirect(`/${countryCode}/page/our-mission`)
}
