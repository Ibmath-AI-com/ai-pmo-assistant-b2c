import { apiClient } from './client'

export interface UserDetail {
  user_id: string
  username: string
  email: string
  mobile_number: string | null
  status: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  language_preference: string | null
  timezone: string | null
}

export interface UserProfileDetail {
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  gender: string | null
  country: string | null
  job_title: string | null
}

export interface SubscriptionInfo {
  package_name: string
  billing_status: string
  billing_cycle: string
  start_date: string
  end_date: string | null
  next_billing_date: string | null
}

export interface BillingOrder {
  order_date: string
  amount: number
  currency: string
  order_status: string
  invoice_number: string
  invoice_url: string | null
}

export interface BillingOrdersResponse {
  total: number
  page: number
  limit: number
  items: BillingOrder[]
}

export interface PaymentMethod {
  payment_method_id: string
  card_brand: string | null
  last_four: string
  expiry_month: number
  expiry_year: number
  is_default: boolean
  status: string
}

export interface PaymentMethodCreate {
  card_brand?: string
  last_four: string
  expiry_month: number
  expiry_year: number
}

export interface UpdateUserRequest {
  username?: string
  mobile_number?: string
  first_name?: string
  last_name?: string
}

export interface UpdateProfileRequest {
  first_name?: string
  last_name?: string
  date_of_birth?: string
  gender?: string
  country?: string
}

export const profileApi = {
  getMe: () =>
    apiClient.get<UserDetail>('/api/v1/users/me').then((r) => r.data),

  patchMe: (data: UpdateUserRequest) =>
    apiClient.patch<UserDetail>('/api/v1/users/me', data).then((r) => r.data),

  getProfile: () =>
    apiClient.get<UserProfileDetail>('/api/v1/users/me/profile').then((r) => r.data),

  patchProfile: (data: UpdateProfileRequest) =>
    apiClient.patch<UserProfileDetail>('/api/v1/users/me/profile', data).then((r) => r.data),

  getSubscription: () =>
    apiClient.get<SubscriptionInfo>('/api/v1/users/me/subscription').then((r) => r.data),

  getBillingOrders: (page = 1, limit = 10) =>
    apiClient
      .get<BillingOrdersResponse>('/api/v1/users/me/billing/orders', { params: { page, limit } })
      .then((r) => r.data),

  listPaymentMethods: () =>
    apiClient.get<PaymentMethod[]>('/api/v1/users/me/payment-methods').then((r) => r.data),

  addPaymentMethod: (data: PaymentMethodCreate) =>
    apiClient.post<PaymentMethod>('/api/v1/users/me/payment-methods', data).then((r) => r.data),

  setDefaultPaymentMethod: (id: string) =>
    apiClient
      .patch<PaymentMethod>(`/api/v1/users/me/payment-methods/${id}/default`)
      .then((r) => r.data),

  removePaymentMethod: (id: string) =>
    apiClient.delete(`/api/v1/users/me/payment-methods/${id}`),
}
