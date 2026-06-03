export interface AuthenticatedRequest {
  companyId?: string;
  headers?: Record<string, any>;
  body?: any;
  params?: any;
  query?: any;
}

export interface ClassificationResult {
  category: string;
  confidence: number;
}

export interface CustomerValidationResult {
  valid: boolean;
  customerData: any | null;
}

export interface VectorDocument {
  pageContent: string;
  metadata?: Record<string, any>;
}

export interface CompanyConfig {
  apiBaseUrl?: string;
  apiAuthType?: 'none' | 'bearer' | 'api_key' | 'custom_headers';
  apiAuthToken?: string;
  apiHeaders?: Record<string, string>;
}
