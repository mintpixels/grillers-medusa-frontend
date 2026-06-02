import {
  getAddressSuggestionConflict,
  type AddressSuggestionFields,
} from "@modules/checkout/components/shipping-address/address-suggestion"

const suggestion: AddressSuggestionFields = {
  address_1: "1 Market St",
  city: "San Francisco",
  province: "CA",
  postal_code: "94105",
  country_code: "us",
}

describe("address suggestion conflicts", () => {
  it("allows matching state and zip suggestions", () => {
    expect(
      getAddressSuggestionConflict(
        { city: "San Francisco", province: "ca", postal_code: "94105-1234" },
        suggestion
      )
    ).toBeNull()
  })

  it("flags a suggestion that would silently change state", () => {
    expect(
      getAddressSuggestionConflict(
        { city: "Atlanta", province: "GA", postal_code: "94105" },
        suggestion
      )
    ).toEqual({
      typed: "Atlanta, GA, 94105",
      suggested: "San Francisco, CA, 94105",
    })
  })

  it("flags a suggestion that would silently change zip", () => {
    expect(
      getAddressSuggestionConflict(
        { city: "San Francisco", province: "CA", postal_code: "30318" },
        suggestion
      )
    ).toEqual({
      typed: "San Francisco, CA, 30318",
      suggested: "San Francisco, CA, 94105",
    })
  })

  it("allows suggestions when state and zip are empty", () => {
    expect(
      getAddressSuggestionConflict(
        { city: "", province: "", postal_code: "" },
        suggestion
      )
    ).toBeNull()
  })
})
