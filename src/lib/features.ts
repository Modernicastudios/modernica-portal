// Centrale plek voor à-la-carte feature-flags die de super admin per agency
// aan/uit zet. Opgeslagen in agencies.features (jsonb).

export type AgencyFeature = 'lead_machine' | 'white_label' | 'custom_domain' | 'hide_powered_by'

type FeatureBag = Record<string, boolean> | null | undefined

export function hasFeature(features: FeatureBag, feature: AgencyFeature): boolean {
  return Boolean(features?.[feature])
}
