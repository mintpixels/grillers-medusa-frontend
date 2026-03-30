import ProfileName from "@modules/account/components/profile-name"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfilePhone from "@modules/account/components/profile-phone"
import ProfilePassword from "@modules/account/components/profile-password"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listRegions } from "@lib/data/regions"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Profile | Grillers Pride",
  description: "Manage your account profile information.",
}

export default async function Profile() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="space-y-6" data-testid="profile-page-wrapper">
      <div>
        <h1 className="text-h3 font-gyst font-bold text-Charcoal">My Profile</h1>
        <p className="text-sm font-maison-neue text-Charcoal/50 mt-1">
          Manage your account information
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ProfileName customer={customer} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ProfileEmail customer={customer} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ProfilePhone customer={customer} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ProfilePassword customer={customer} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ProfileBillingAddress customer={customer} regions={regions} />
        </div>
      </div>
    </div>
  )
}
