import AddressBook from "@modules/account/components/address-book"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listRegions } from "@lib/data/regions"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Addresses | Grillers Pride",
  description: "Manage your shipping addresses.",
}

export default async function Addresses() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="space-y-6" data-testid="addresses-page-wrapper">
      <div>
        <h1 className="text-h3 font-gyst font-bold text-Charcoal">My Addresses</h1>
        <p className="text-sm font-maison-neue text-Charcoal/50 mt-1">
          Manage your shipping addresses
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AddressBook customer={customer} region={regions[0]} />
      </div>
    </div>
  )
}
