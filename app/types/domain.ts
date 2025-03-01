export interface DomainAnalysis {
  url: string;
  ip: string;
  whois_info: WhoisInfo;
  ip_info: IpInfo;
  dns_records: DnsRecords;
  detected_brand?: DetectedBrand;
  brand_category?: string;
  risk_score: number;
  phishing_indicators: string[];
  takedown_text: string;
}

export interface WhoisInfo {
  registrar?: string;
  creation_date?: string;
  expiration_date?: string;
  registrar_abuse_contact_email?: string;
}

export interface IpInfo {
  ip: string;
  abuse_contact?: string;
  asn?: AsnInfo;
}

export interface AsnInfo {
  asn: string;
  org: string;
  route: string;
  country: string;
}

export interface DnsRecords {
  A?: string[];
  NS?: string[];
  MX?: string[];
  TXT?: string[];
}

export interface DetectedBrand {
  name: string;
  confidence: number;
}

export interface TakedownRequest {
  url: string;
  ip: string;
  ipInfo: IpInfo;
  dns_records: DnsRecords;
  primaryTarget: string;
  whois_info: WhoisInfo;
  templateType: string;
}

export interface IntelligentAnalysisResult {
  entities: Entity[];
  summary: string;
  recommendations: string[];
}

export interface Entity {
  name: string;
  type: string;
  confidence: number;
}

export interface GenerateTakedownRequest {
  analysis: DomainAnalysis;
  detectedBrand?: string;
  phishingIndicators: string[];
} 