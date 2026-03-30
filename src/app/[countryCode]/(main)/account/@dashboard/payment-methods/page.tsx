import { Metadata } from "next"
import { getSavedPaymentMethods } from "@lib/data/payment"
import PaymentMethodsList from "@modules/account/components/payment-methods-list"

export const metadata: Metadata = {
  title: "Payment Methods | Grillers Pride",
  description: "Manage your saved payment methods.",
}

export default async function PaymentMethodsPage() {
  const methods = await getSavedPaymentMethods()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h3 font-gyst font-bold text-Charcoal">Payment Methods</h1>
        <p className="text-sm font-maison-neue text-Charcoal/50 mt-1">
          Manage your saved credit and debit cards
        </p>
      </div>
      <PaymentMethodsList initialMethods={methods} />
    </div>
  )
}
