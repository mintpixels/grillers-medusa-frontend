/**
 * Bulk assign "Shipping Profile 1" to all products in Medusa.
 * 
 * Usage: node assign-shipping-profiles.js
 * 
 * You will be prompted for your admin password.
 */

const MEDUSA_URL = "https://grillers-medusa-admin-production.up.railway.app"
const ADMIN_EMAIL = "apps@humancode.io"
const SHIPPING_PROFILE_ID = "sp_01JVW2QFGREJWXDK39GV68JW92" // Shipping Profile 1 (type: ALL)

async function main() {
  // Prompt for password
  const readline = require("readline")
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const password = await new Promise((resolve) => {
    rl.question("Enter Medusa admin password: ", (answer) => {
      rl.close()
      resolve(answer)
    })
  })

  // 1. Authenticate
  console.log("\nAuthenticating...")
  const authRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password }),
  })
  const authData = await authRes.json()
  
  if (!authData.token) {
    console.error("Authentication failed:", authData.message || authData)
    process.exit(1)
  }
  
  const token = authData.token
  console.log("Authenticated successfully!\n")

  // 2. Fetch all products (paginate)
  let allProducts = []
  let offset = 0
  const limit = 100

  while (true) {
    const res = await fetch(`${MEDUSA_URL}/admin/products?limit=${limit}&offset=${offset}&fields=id,title`, {
      headers: {
        "authorization": `Bearer ${token}`,
        "accept": "application/json",
      },
    })
    const data = await res.json()
    const products = data.products || []
    allProducts = allProducts.concat(products)
    
    if (products.length < limit) break
    offset += limit
  }

  console.log(`Found ${allProducts.length} products total.\n`)

  // 3. Assign shipping profile to each product
  let success = 0
  let failed = 0

  for (const product of allProducts) {
    try {
      const res = await fetch(`${MEDUSA_URL}/admin/products/${product.id}`, {
        method: "POST",
        headers: {
          "authorization": `Bearer ${token}`,
          "content-type": "application/json",
          "accept": "application/json",
        },
        body: JSON.stringify({ shipping_profile_id: SHIPPING_PROFILE_ID }),
      })

      if (res.ok) {
        success++
        process.stdout.write(`\r  Updated ${success}/${allProducts.length}...`)
      } else {
        const err = await res.json()
        failed++
        console.log(`\n  FAILED: ${product.title.substring(0, 50)} - ${err.message}`)
      }
    } catch (err) {
      failed++
      console.log(`\n  ERROR: ${product.title.substring(0, 50)} - ${err.message}`)
    }
  }

  console.log(`\n\nDone! ${success} products updated, ${failed} failed.`)
}

main().catch(console.error)
