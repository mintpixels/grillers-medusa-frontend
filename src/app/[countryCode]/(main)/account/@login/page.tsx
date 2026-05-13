import LoginTemplate from "@modules/account/templates/login-template"

// Title / description live on the parent layout's generateMetadata (#22).
// Static metadata here would override the layout and break auth-aware
// tab titles for parallel-route slots.

// force-dynamic on the parent layout doesn't propagate to parallel slot
// pages — without it here, Vercel prerenders this slot at build time
// and the whole /us/account subtree was serving a static 500.
export const dynamic = "force-dynamic"

export default function Login() {
  return <LoginTemplate />
}
