import { Metadata } from "next"
import ResetPassword from "@modules/account/components/reset-password"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Reset password | Grillers Pride",
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = await searchParams

  return (
    <div className="flex justify-center items-center min-h-[60vh] px-4 py-16">
      {token && email ? (
        <ResetPassword token={token} email={email} />
      ) : (
        <div className="max-w-sm w-full flex flex-col items-center text-center">
          <h1 className="text-large-semi uppercase mb-6">Invalid link</h1>
          <p className="text-base-regular text-ui-fg-base mb-8">
            This password reset link is missing required information. Please
            request a new one.
          </p>
          <LocalizedClientLink
            href="/account"
            className="underline text-small-regular text-ui-fg-base hover:text-Gold transition-colors"
          >
            Back to sign in
          </LocalizedClientLink>
        </div>
      )}
    </div>
  )
}

export const dynamic = "force-dynamic"
