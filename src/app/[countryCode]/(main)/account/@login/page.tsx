import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Sign in | Griller's Pride",
  description: "Sign in to your Griller's Pride account.",
}

export default function Login() {
  return <LoginTemplate />
}
