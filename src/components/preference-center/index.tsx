"use client"

import { useState, useTransition } from "react"
import { updatePreferences } from "@lib/data/preferences"

const TOPIC_LABELS: Record<string, string> = {
  promotions: "Specials and promotions",
  new_products: "New cuts and products",
  recipes: "Recipes and cooking help",
  holiday_reminders: "Holiday order deadlines",
  back_in_stock: "Back-in-stock alerts",
  product_education: "Kosher meat education",
}

type Props = {
  token: string
  initial: {
    email_masked: string
    first_name: string
    email_consent: boolean
    topics: Record<string, boolean>
  }
}

export default function PreferenceCenter({ token, initial }: Props) {
  const [topics, setTopics] = useState(initial.topics)
  const [saved, setSaved] = useState<string | null>(null)
  const [unsubscribed, setUnsubscribed] = useState(!initial.email_consent)
  const [isPending, startTransition] = useTransition()

  const save = () => {
    setSaved(null)
    startTransition(async () => {
      const result = await updatePreferences(token, { topics })
      setSaved(result.ok ? "Saved — thanks for telling us." : "Could not save; try again.")
    })
  }

  const unsubscribeAll = () => {
    setSaved(null)
    startTransition(async () => {
      const result = await updatePreferences(token, { unsubscribe_all: true })
      if (result.ok) setUnsubscribed(true)
      else setSaved("Could not save; try again.")
    })
  }

  if (unsubscribed) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-gyst font-bold text-Charcoal">
          You&apos;re unsubscribed
        </h1>
        <p className="mt-3 text-sm text-Charcoal/65">
          {initial.email_masked} won&apos;t receive marketing email from
          Griller&apos;s Pride. Order receipts and delivery updates still
          arrive as usual.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-gyst font-bold text-Charcoal">
        Email preferences
      </h1>
      <p className="mt-2 text-sm text-Charcoal/65">
        Choose what {initial.email_masked} hears about.
      </p>
      <div className="mt-6 grid gap-3">
        {Object.entries(TOPIC_LABELS).map(([topic, label]) => (
          <label
            key={topic}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3"
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-Gold"
              checked={topics[topic] !== false}
              onChange={(event) =>
                setTopics((current) => ({
                  ...current,
                  [topic]: event.target.checked,
                }))
              }
            />
            <span className="text-sm font-maison-neue text-Charcoal">
              {label}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-Charcoal px-4 text-sm font-rexton font-bold uppercase text-white disabled:opacity-50"
        >
          Save preferences
        </button>
        <button
          type="button"
          onClick={unsubscribeAll}
          disabled={isPending}
          className="text-sm text-Charcoal/55 underline underline-offset-4"
        >
          Unsubscribe from all marketing email
        </button>
        {saved ? (
          <p className="text-center text-sm text-Charcoal/70">{saved}</p>
        ) : null}
      </div>
    </main>
  )
}
