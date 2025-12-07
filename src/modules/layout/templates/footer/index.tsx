import { Text } from "@medusajs/ui"
import Image from "next/image"
import Link from "next/link"
import strapiClient from "@lib/strapi"
import { GetFooterQuery, type FooterData } from "@lib/data/strapi/footer"
import NewsletterForm from "@/components/newsletter-form"

async function getFooterData(): Promise<FooterData | null> {
  try {
    const data = await strapiClient.request<FooterData>({
      document: GetFooterQuery,
    })
    return data
  } catch (error) {
    console.error("Error fetching footer data:", error)
    return null
  }
}

// Social media icons with built-in SVGs for common platforms
const SocialIcon = ({ platform }: { platform: string }) => {
  const iconClass = "w-5 h-5 fill-current"
  
  switch (platform.toLowerCase()) {
    case "facebook":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    case "instagram":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      )
    case "twitter":
    case "x":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    case "youtube":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    case "tiktok":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      )
    case "linkedin":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    case "pinterest":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
        </svg>
      )
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      )
  }
}

export default async function Footer() {
  const footerData = await getFooterData()
  const footer = footerData?.footer

  // Fallback copyright text
  const copyrightText =
    footer?.CopyrightText ||
    `© ${new Date().getFullYear()} Grillers Pride. All rights reserved.`

  // Check what data we have available
  const hasNavigationColumns = footer?.NavigationColumns && footer.NavigationColumns.length > 0
  const hasSocialLinks = footer?.SocialLinks && footer.SocialLinks.length > 0
  const hasContactInfo = footer?.ContactPhone || footer?.ContactEmail || footer?.ContactAddress
  const hasLegalLinks = footer?.LegalLinks && footer.LegalLinks.length > 0
  const hasCertificationBadges = footer?.CertificationBadges && footer.CertificationBadges.length > 0
  const showNewsletter = footer?.ShowNewsletterSection === true

  // Minimal fallback footer when no Strapi data
  if (!footer) {
    return (
      <footer className="bg-Charcoal text-white w-full">
        <div className="content-container py-12">
          <div className="flex flex-col items-center gap-y-6">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logos/logo-horizontal.svg"
                alt="Grillers Pride"
                width={180}
                height={36}
                className="brightness-0 invert"
              />
            </Link>
            <Text className="text-sm text-Pewter text-center">
              {copyrightText}
            </Text>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-Charcoal text-white w-full">
      {/* Newsletter Section - Only shows if enabled in Strapi */}
      {showNewsletter && (
        <div className="bg-Gold">
          <div className="content-container py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="max-w-md">
                {footer.NewsletterTitle && (
                  <h3 className="font-rexton text-h4 md:text-h3 text-Charcoal uppercase mb-2">
                    {footer.NewsletterTitle}
                  </h3>
                )}
                {footer.NewsletterDescription && (
                  <p className="text-p-md text-Charcoal/80">
                    {footer.NewsletterDescription}
                  </p>
                )}
              </div>
              <div className="w-full md:w-auto">
                <NewsletterForm
                  title=""
                  description=""
                  placeholderText="Enter your email"
                  buttonText="Subscribe"
                  successMessage="Thank you for subscribing!"
                  errorMessage="Please enter a valid email address."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="content-container">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Logo, Contact & Social Column */}
            <div className="lg:col-span-4 flex flex-col gap-y-6">
              {/* Logo */}
              <Link href="/" className="inline-block w-fit">
                <Image
                  src="/images/logos/logo-horizontal.svg"
                  alt="Grillers Pride"
                  width={180}
                  height={36}
                  className="brightness-0 invert"
                />
              </Link>

              {/* Contact Information */}
              {hasContactInfo && (
                <div className="flex flex-col gap-y-3">
                  {footer.ContactPhone && (
                    <a
                      href={`tel:${footer.ContactPhone.replace(/\D/g, "")}`}
                      className="text-p-md text-Pewter hover:text-Gold transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                      {footer.ContactPhone}
                    </a>
                  )}
                  {footer.ContactEmail && (
                    <a
                      href={`mailto:${footer.ContactEmail}`}
                      className="text-p-md text-Pewter hover:text-Gold transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      {footer.ContactEmail}
                    </a>
                  )}
                  {footer.ContactAddress && (
                    <p className="text-p-sm text-Pewter/70 flex items-start gap-2">
                      <svg className="w-4 h-4 fill-current mt-0.5 shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      {footer.ContactAddress}
                    </p>
                  )}
                </div>
              )}

              {/* Social Links */}
              {hasSocialLinks && (
                <div className="flex items-center gap-4 pt-2">
                  {footer.SocialLinks.map((social) => (
                    <a
                      key={social.id}
                      href={social.Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-Pewter hover:text-Gold transition-colors p-2 -m-2"
                      aria-label={`Follow us on ${social.Platform}`}
                    >
                      {social.Icon?.url ? (
                        <Image
                          src={social.Icon.url}
                          alt={social.Platform}
                          width={20}
                          height={20}
                          className="brightness-0 invert opacity-70 hover:opacity-100"
                        />
                      ) : (
                        <SocialIcon platform={social.Platform} />
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Columns */}
            {hasNavigationColumns && (
              <div className="lg:col-span-8">
                <div className={`grid gap-8 ${
                  footer.NavigationColumns.length === 1 
                    ? 'grid-cols-1' 
                    : footer.NavigationColumns.length === 2 
                    ? 'grid-cols-2' 
                    : footer.NavigationColumns.length === 3 
                    ? 'grid-cols-2 md:grid-cols-3' 
                    : 'grid-cols-2 md:grid-cols-4'
                }`}>
                  {footer.NavigationColumns.map((column) => (
                    <div key={column.id} className="flex flex-col gap-y-4">
                      <h4 className="font-rexton text-h6 uppercase tracking-wider text-white">
                        {column.Title}
                      </h4>
                      {column.Links && column.Links.length > 0 && (
                        <ul className="flex flex-col gap-y-2.5">
                          {column.Links.map((link) => (
                            <li key={link.id}>
                              <Link
                                href={link.Url}
                                className="text-p-sm text-Pewter hover:text-Gold transition-colors"
                              >
                                {link.Text}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Certification Badges */}
        {hasCertificationBadges && (
          <div className="py-8 border-t border-white/10">
            <div className="flex flex-wrap justify-center items-center gap-8">
              {footer.CertificationBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 group"
                  title={badge.Description || badge.Name}
                >
                  {badge.Image?.url ? (
                    <Image
                      src={badge.Image.url}
                      alt={badge.Name}
                      width={56}
                      height={56}
                      className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <span className="text-p-sm text-Pewter">{badge.Name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar - Copyright & Legal */}
        <div className="py-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Text className="text-p-ex-sm-mono text-Pewter/60 text-center sm:text-left">
              {copyrightText}
            </Text>

            {hasLegalLinks && (
              <nav aria-label="Legal links">
                <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                  {footer.LegalLinks.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.Url}
                        className="text-p-ex-sm-mono text-Pewter/60 hover:text-Gold transition-colors"
                      >
                        {link.Text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
