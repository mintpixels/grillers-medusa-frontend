"use client"

import { useState } from "react"
import { completePasswordReset } from "@lib/data/customer"
import Input from "@modules/common/components/input"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  token: string
  email: string
}

const ResetPassword = ({ token, email }: Props) => {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    const result = await completePasswordReset(token, email, password)
    setIsLoading(false)

    if (result.success) {
      setSubmitted(true)
    } else {
      setError(result.error || "Something went wrong. Please try again.")
    }
  }

  if (submitted) {
    return (
      <div className="max-w-sm w-full flex flex-col items-center">
        <h1 className="text-large-semi uppercase mb-6">Password updated</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          Your password has been reset. You can now sign in with your new
          password.
        </p>
        <LocalizedClientLink
          href="/account"
          className="underline text-small-regular text-ui-fg-base hover:text-Gold transition-colors"
        >
          Sign in
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="reset-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Set new password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Enter a new password for <strong>{email}</strong>.
      </p>
      <form className="w-full" onSubmit={handleSubmit}>
        <Input
          label="New password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          data-testid="reset-password-input"
        />
        <div className="mt-4">
          <Input
            label="Confirm new password"
            name="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            data-testid="reset-password-confirm"
          />
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <SubmitButton
          data-testid="reset-password-submit"
          className="w-full mt-6"
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Update password"}
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Need a new link?{" "}
        <LocalizedClientLink href="/account" className="underline">
          Request reset
        </LocalizedClientLink>
      </span>
    </div>
  )
}

export default ResetPassword
