export interface DomainAnalysis {
  domain: string;
  ip: string;
  whois_info: WhoisInfo;
  ip_info: IpInfo;
  dns_records: DnsRecords;
  error?: string;
}

export interface WhoisInfo {
  registrar?: string;
  creation_date?: string;
  expiration_date?: string;
  registrar_abuse_contact_email?: string;
}

export interface IpInfo {
  asn?: {
    asn: number;
    org: string;
    country: string;
    descr: string;
    domain: string;
    type: string;
    abuser_score: string;
    abuse: string;
    route: string;
    created: string;
    updated: string;
  };
  abuse_contact?: string;
}

export interface DnsRecords {
  A: string[];
  MX: string[];
  NS: string[];
  TXT: string[];
} 