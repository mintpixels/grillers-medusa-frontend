import { act, render } from "@testing-library/react"

import GlobalErrorListeners from "@components/global-error-listeners"

function dispatchUnhandledRejection(reason: unknown) {
  const event = new Event("unhandledrejection")
  Object.defineProperty(event, "reason", { value: reason })
  act(() => {
    window.dispatchEvent(event)
  })
}

describe("GlobalErrorListeners", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    window.history.replaceState({}, "", "/")
    jest.restoreAllMocks()
  })

  it("drops NEXT_REDIRECT rejections globally while reporting real rejections", () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock as any
    render(<GlobalErrorListeners />)

    window.history.replaceState({}, "", "/us/cart")
    dispatchUnhandledRejection(new Error("NEXT_REDIRECT"))
    dispatchUnhandledRejection("Error: NEXT_REDIRECT")

    window.history.replaceState({}, "", "/us/account")
    dispatchUnhandledRejection({
      digest: "NEXT_REDIRECT;replace;/us/account;307;",
    })

    expect(fetchMock).not.toHaveBeenCalled()

    dispatchUnhandledRejection(new Error("Inventory request failed"))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ops-alert",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
      })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toMatchObject({
      alert_kind: "client_unhandledrejection",
      path: "/us/account",
      title: "Error: Inventory request failed",
    })
  })
})
