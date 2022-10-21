export interface CanUserUpdateStatus {
  status: boolean
  reason?: 'NOT_FOUND' | 'UNAUTHORIZED'
}
