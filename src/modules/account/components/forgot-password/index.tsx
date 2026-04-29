"use client"

import { useState } from "react"
import { requestPasswordReset } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import { SubmitButton } from "@modules/checkout/components/submit-button"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const ForgotPassword = ({ setCurrentView }: Props) => {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await requestPasswordReset(email)
    setSubmitted(true)
    setIsLoading(false)
  }

  if (submitted) {
    return (
      <div className="max-w-sm w-full flex flex-col items-center">
        <h1 className="text-large-semi uppercase mb-6">Check your email</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a
          link to reset your password.
        </p>
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline text-small-regular text-ui-fg-base hover:text-Gold transition-colors"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="forgot-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Reset password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <form className="w-full" onSubmit={handleSubmit}>
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          title="Enter your email address."
          autoComplete="email"
          required
          data-testid="forgot-password-email-input"
        />
        <SubmitButton
          data-testid="forgot-password-submit"
          className="w-full mt-6"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Remember your password?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          Sign in
        </button>
      </span>
    </div>
  )
}

export default ForgotPassword
