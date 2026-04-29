import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export default async function LegalRedirect({ params }: Props) {
  const { countryCode, slug } = await params
  redirect(`/${countryCode}/page/${slug}`)
}
