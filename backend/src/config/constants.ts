export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretflowdeskkey';
export const JWT_EXPIRY = '7d';

export const ISSUE_CATEGORIES = [
  'bandwidth_exceeded',
  'website_down',
  'billing_issue',
  'refund_request',
  'upgrade_request',
  'login_issue',
  'api_quota_exceeded',
  'subscription_issue',
  'order_issue',
  'order_tracking',
  'password_reset',
  'service_restart',
  'general_inquiry',
] as const;

export const UPLOAD_DIR = 'uploads/';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
