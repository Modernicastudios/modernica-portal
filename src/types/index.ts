export type UserRole = 'super_admin' | 'admin' | 'manager' | 'client'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  agency_id: string | null
  client_id: string | null
  avatar_url: string | null
  timezone: string
  last_active_at: string | null
  created_at: string
}

export interface Agency {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_plan: 'free' | 'starter' | 'growth' | 'enterprise'
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled'
  max_clients: number
  max_social_accounts: number
  features: Record<string, boolean>
  created_at: string
}

export interface BrandKit {
  id: string
  agency_id: string
  primary_color: string
  secondary_color: string
  logo_url: string | null
  favicon_url: string | null
  login_bg_url: string | null
  contact_email: string | null
  welcome_message: string | null
  welcome_subtitle: string | null
  powered_by_visible: boolean
  instagram_handle: string | null
  tiktok_handle: string | null
  linkedin_handle: string | null
  youtube_handle: string | null
  facebook_handle: string | null
}

export interface Client {
  id: string
  agency_id: string
  company_name: string
  industry: string | null
  city: string | null
  contact_email: string | null
  created_at: string
}

export interface Project {
  id: string
  agency_id: string
  client_id: string | null
  title: string
  description: string | null
  status: 'backlog' | 'in_progress' | 'review' | 'approved' | 'archived'
  priority: 'normal' | 'high' | 'urgent'
  category: string | null
  created_at: string
  updated_at: string
  client?: Client
}

export interface ClientTask {
  id: string
  agency_id: string
  client_id: string
  created_by: string
  assigned_to: string | null
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'waiting' | 'done'
  due_date: string | null
  completed_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SocialAccount {
  id: string
  agency_id: string
  client_id: string | null
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube'
  platform_account_id: string
  platform_username: string | null
  platform_avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface AdAccount {
  id: string
  agency_id: string
  client_id: string | null
  platform: 'meta_ads' | 'google_ads' | 'tiktok_ads' | 'linkedin_ads'
  platform_account_id: string
  platform_account_name: string | null
  currency: string
  is_active: boolean
  last_synced_at: string | null
  created_at: string
}

export interface ContentPost {
  id: string
  agency_id: string
  client_id: string | null
  title: string | null
  platform: string
  content_type: string | null
  status: string
  approval_status: string
  scheduled_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  message: string
  read: boolean
  created_at: string
}

export interface TenantContext {
  agencyId: string | null
  slug: string | null
  brandKit: BrandKit | null
  agency: Agency | null
}
