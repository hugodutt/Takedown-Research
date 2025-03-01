export interface DomainAnalysis {
  domain: string;
  ip: string;
  whois_info: {
    registrar: string;
    creation_date: string;
    expiration_date: string;
    registrar_abuse_contact_email: string;
  };
  ip_info: {
    abuse_contact: string;
    asn: {
      asn: string;
      org: string;
      country: string;
      descr: string;
      route: string;
      type: string;
      abuser_score: number;
      domain: string;
      created: string;
      updated: string;
    };
  };
  dns_records: {
    A: string[];
    MX: string[];
    NS: string[];
    TXT: string[];
  };
}

export interface TakedownRequest {
  domain: string;
  ip: string;
  detectedBrand: {
    name: string;
    officialSite?: string;
  } | null;
  indicators: string[];
  whois: {
    registrar: string;
    creation_date: string;
    expiration_date: string;
    registrar_abuse_contact_email: string;
  };
  ipInfo: {
    abuse_contact: string;
    asn: {
      asn: string;
      org: string;
      country: string;
      descr: string;
      route: string;
      type: string;
      abuser_score: number;
      domain: string;
      created: string;
      updated: string;
    };
  };
  dns_records: {
    A: string[];
    MX: string[];
    NS: string[];
    TXT: string[];
  };
}

export interface GenerateTakedownRequest {
  analysis: DomainAnalysis;
  detectedBrand?: string;
  phishingIndicators: string[];
} 