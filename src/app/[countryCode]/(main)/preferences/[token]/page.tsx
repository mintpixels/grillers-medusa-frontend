import { Metadata } from "next"
import { getPreferences } from "@lib/data/preferences"
import PreferenceCenter from "@components/preference-center"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Email preferences | Griller's Pride",
  robots: { index: false, follow: false },
}

export default async function PreferencesPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const preferences = await getPreferences(token)

  if (!preferences) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-gyst font-bold text-Charcoal">
          This link has expired
        </h1>
        <p className="mt-3 text-sm text-Charcoal/65">
          Use the preferences link from a recent Griller&apos;s Pride email,
          or contact us at (770) 454-8108 and we&apos;ll sort it out.
        </p>
      </main>
    )
  }

  return <PreferenceCenter token={token} initial={preferences} />
}
