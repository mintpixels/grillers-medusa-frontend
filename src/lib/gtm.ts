// Google Tag Manager initialization and helpers

export type GTMConfig = {
  gtmId: string
  dataLayer?: Record<string, any>[]
  debug?: boolean
}

export function getGTMScripts(config: GTMConfig) {
  const { gtmId, dataLayer = [], debug = false } = config

  // Initialize dataLayer
  const dataLayerScript = `
    window.dataLayer = window.dataLayer || [];
    ${dataLayer.length > 0 ? `window.dataLayer.push(${JSON.stringify(dataLayer)});` : ''}
    ${debug ? 'console.log("GTM Debug Mode: dataLayer initialized", window.dataLayer);' : ''}
  `

  // GTM Head Script
  const gtmHeadScript = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `

  // GTM Body Noscript
  const gtmBodyNoScript = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`

  return {
    dataLayerScript,
    gtmHeadScript,
    gtmBodyNoScript,
  }
}

// GTM Event helpers for ecommerce tracking
export function pushToDataLayer(event: Record<string, any>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event)
  }
}

export function trackPageView(url: string) {
  pushToDataLayer({
    event: 'page_view',
    page_location: url,
    page_title: document.title,
  })
}

export function trackAddToCart(product: any, quantity: number) {
  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: product.price,
          quantity: quantity,
        },
      ],
    },
  })
}

export function trackPurchase(order: any) {
  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: order.id,
      value: order.total,
      currency: order.currency_code,
      items: order.items?.map((item: any) => ({
        item_id: item.product_id,
        item_name: item.title,
        price: item.unit_price,
        quantity: item.quantity,
      })),
    },
  })
}

// Declare dataLayer on window
declare global {
  interface Window {
    dataLayer: Record<string, any>[]
  }
}



