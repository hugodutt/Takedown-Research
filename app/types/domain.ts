export interface DomainAnalysis {
  url: string;
  ip: string;
  whois_info: WhoisInfo;
  ip_info: {
    ip: string;
    abuse_contact: string;
    asn: {
      asn: string;
      org: string;
      route: string;
      country: string;
    };
  };
  dns_records: DnsRecords;
  detected_brand?: DetectedBrand;
  brand_category?: string;
  risk_score: number;
  phishing_indicators: string[];
  takedown_text: string;
}

export interface WhoisInfo {
  domain_name: string;
  registrar?: string;
  registrar_whois_server?: string;
  registrar_url?: string;
  registrar_abuse_contact_email?: string;
  registrar_abuse_contact_phone?: string;
  creation_date?: string;
  updated_date?: string;
  expiration_date?: string;
  name_servers?: string[];
  status?: string[];
  dnssec?: string;
}

export interface IpInfo {
  ip: string;
  abuse_contact: string;
  asn?: {
    asn: string;
    org: string;
    route: string;
    country: string;
  };
}

export interface DnsRecords {
  a?: string[];
  aaaa?: string[];
  mx?: string[];
  ns?: string[];
  txt?: string[];
  soa?: string[];
  ptr?: string[];
  srv?: string[];
  cname?: string[];
}

export interface DetectedBrand {
  name: string;
  confidence: number;
  category: string;
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