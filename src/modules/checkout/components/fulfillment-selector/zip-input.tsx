"use client"

import { Button } from "@medusajs/ui"

type ZipInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  error?: string | null
}

export default function ZipInput({
  value,
  onChange,
  onSubmit,
  error,
}: ZipInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 5 digits
    const val = e.target.value.replace(/\D/g, "").slice(0, 5)
    onChange(val)
  }

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter zip code"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Gold focus:border-transparent text-lg"
            maxLength={5}
            autoFocus
          />
        </div>
        <Button
          onClick={onSubmit}
          disabled={value.length < 5}
          size="large"
          className="px-8"
        >
          Continue
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
