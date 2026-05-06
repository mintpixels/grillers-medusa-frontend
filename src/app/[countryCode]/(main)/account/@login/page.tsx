import LoginTemplate from "@modules/account/templates/login-template"

// Title / description live on the parent layout's generateMetadata (#22).
// Static metadata here would override the layout and break auth-aware
// tab titles for parallel-route slots.

export default function Login() {
  return <LoginTemplate />
}
