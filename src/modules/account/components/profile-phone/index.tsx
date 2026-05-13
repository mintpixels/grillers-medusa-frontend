"use client"

import React, { useEffect, useActionState } from "react";

import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { updateCustomer } from "@lib/data/customer"
import { formatPhone, stripPhone } from "@lib/util/format-phone"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)

  const updateCustomerPhone = async (
    _currentState: Record<string, unknown>,
    formData: FormData
  ) => {
    const raw = (formData.get("phone") as string) || ""
    // Reject partial / malformed phones up front. Empty is allowed (clears
    // the phone). Anything non-empty that doesn't strip to exactly 10
    // digits would silently corrupt the saved value.
    if (raw && stripPhone(raw).length !== 10) {
      return {
        success: false,
        error: "Phone number must be a 10-digit US number.",
      }
    }
    // Normalize to digits-only so the rendered phone is always derived
    // from `formatPhone(stripPhone(customer.phone))` regardless of what
    // the user typed (#68). Empty string clears the phone.
    const customer = { phone: raw ? stripPhone(raw) : "" }

    try {
      await updateCustomer(customer)
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.toString() }
    }
  }

  const [state, formAction] = useActionState(updateCustomerPhone, {
    error: false,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form action={formAction} className="w-full">
      <AccountInfo
        label="Phone"
        currentInfo={
          customer.phone ? formatPhone(stripPhone(customer.phone)) : ""
        }
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error}
        clearState={clearState}
        data-testid="account-phone-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            defaultValue={
              customer.phone ? formatPhone(stripPhone(customer.phone)) : ""
            }
            data-testid="phone-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileEmail
