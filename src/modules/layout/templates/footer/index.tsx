import { Text } from "@medusajs/ui"
import Image from "next/image"
import Link from "next/link"
import strapiClient from "@lib/strapi"
import { GetFooterQuery, type FooterData } from "@lib/data/strapi/footer"

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

export default async function Footer() {
  const footerData = await getFooterData()
  const footer = footerData?.footer

  // Fallback values if Strapi data is not available
  const copyrightText =
    footer?.CopyrightText ||
    `© ${new Date().getFullYear()} Grillers Pride. All rights reserved.`

  // If no footer data at all, show simple fallback footer
  if (!footer) {
    return (
      <footer className="bg-Charcoal text-white w-full">
        <div className="content-container flex flex-col w-full py-12">
          <div className="flex flex-col items-center gap-y-6">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logos/logo-horizontal.svg"
                alt="Grillers Pride"
                width={200}
                height={40}
                className="brightness-0 invert"
              />
            </Link>
            <Text className="text-sm text-gray-400 text-center">
              {copyrightText}
            </Text>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-Charcoal text-white w-full">
      <div className="content-container flex flex-col w-full">
        {/* Main Footer Content */}
        <div className="flex flex-col gap-y-8 lg:flex-row lg:justify-between py-12 lg:py-16">
          {/* Logo and Contact Info */}
          <div className="flex flex-col gap-y-6 lg:max-w-xs">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logos/logo-horizontal.svg"
                alt="Grillers Pride"
                width={200}
                height={40}
                className="brightness-0 invert"
              />
            </Link>

            {/* Contact Information */}
            {(footer?.ContactPhone ||
              footer?.ContactEmail ||
              footer?.ContactAddress) && (
              <div className="flex flex-col gap-y-2 text-sm text-gray-300">
                {footer?.ContactPhone && (
                  <a
                    href={`tel:${footer.ContactPhone.replace(/\D/g, "")}`}
                    className="hover:text-white transition-colors"
                  >
                    {footer.ContactPhone}
                  </a>
                )}
                {footer?.ContactEmail && (
                  <a
                    href={`mailto:${footer.ContactEmail}`}
                    className="hover:text-white transition-colors"
                  >
                    {footer.ContactEmail}
                  </a>
                )}
                {footer?.ContactAddress && (
                  <p className="text-gray-400">{footer.ContactAddress}</p>
                )}
              </div>
            )}

            {/* Social Links */}
            {footer?.SocialLinks && footer.SocialLinks.length > 0 && (
              <div className="flex gap-x-4">
                {footer.SocialLinks.map((social) => (
                  <a
                    key={social.id}
                    href={social.Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={social.Platform}
                  >
                    {social.Icon?.url ? (
                      <Image
                        src={social.Icon.url}
                        alt={social.Platform}
                        width={24}
                        height={24}
                        className="brightness-0 invert opacity-70 hover:opacity-100"
                      />
                    ) : (
                      <span className="text-sm">{social.Platform}</span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Columns */}
          {footer?.NavigationColumns && footer.NavigationColumns.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
              {footer.NavigationColumns.map((column) => (
                <div key={column.id} className="flex flex-col gap-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                    {column.Title}
                  </h3>
                  <ul className="flex flex-col gap-y-2">
                    {column.Links.map((link) => (
                      <li key={link.id}>
                        <Link
                          href={link.Url}
                          className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          {link.Text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certification Badges */}
        {footer?.CertificationBadges &&
          footer.CertificationBadges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6 py-8 border-t border-gray-700">
              {footer.CertificationBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-x-2"
                  title={badge.Description || badge.Name}
                >
                  {badge.Image?.url && (
                    <Image
                      src={badge.Image.url}
                      alt={badge.Name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-y-4 py-6 border-t border-gray-700">
          <Text className="text-sm text-gray-400">{copyrightText}</Text>

          {/* Legal Links */}
          {footer?.LegalLinks && footer.LegalLinks.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {footer.LegalLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.Url}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {link.Text}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
