import fs from "fs"
import path from "path"

const PNG_SIGNATURE = "89504e470d0a1a0a"

function readPngDimensions(filePath: string) {
  const bytes = fs.readFileSync(filePath)

  expect(bytes.subarray(0, 8).toString("hex")).toBe(PNG_SIGNATURE)
  expect(bytes.subarray(12, 16).toString("ascii")).toBe("IHDR")

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  }
}

describe("Twilio toll-free verification evidence", () => {
  it("keeps the marketing opt-in proof complete instead of tightly cropped", () => {
    const evidencePath = path.join(
      process.cwd(),
      "public/images/sms-opt-in-web-form.png"
    )
    const dimensions = readPngDimensions(evidencePath)

    // Carrier review needs one legible frame with the Griller's Pride brand,
    // phone field, unchecked checkbox, full disclosure, legal links, and Join.
    expect(dimensions.width).toBeGreaterThanOrEqual(400)
    expect(dimensions.height).toBeGreaterThanOrEqual(900)
  })
})
