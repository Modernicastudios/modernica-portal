const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'modernicaportal.com'

export interface TenantInfo {
  agencyId: string
  slug: string
  name: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
  customDomain: string | null
  subscriptionPlan: string
  features: Record<string, boolean>
}

export function getSlugFromHostname(hostname: string): string | null {
  // modernicaportal.com -> null (marketing site)
  // app.modernicaportal.com -> 'app' (Modernica's own portal)
  // acme.modernicaportal.com -> 'acme' (agency portal)
  // portal.acmeagency.com -> look up by custom domain

  const host = hostname.replace(/:\d+$/, '') // strip port

  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null
  }

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    return host.replace(`.${ROOT_DOMAIN}`, '')
  }

  // Custom domain - return the full hostname for lookup
  return host
}

export function isSubdomain(hostname: string): boolean {
  const host = hostname.replace(/:\d+$/, '')
  return host.endsWith(`.${ROOT_DOMAIN}`) && host !== ROOT_DOMAIN
}

export function isCustomDomain(hostname: string): boolean {
  const host = hostname.replace(/:\d+$/, '')
  return !host.endsWith(`.${ROOT_DOMAIN}`) && host !== ROOT_DOMAIN && host !== `www.${ROOT_DOMAIN}`
}
