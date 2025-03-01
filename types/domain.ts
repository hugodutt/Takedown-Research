export interface DomainAnalysis {
  domain: string;
  ip: string;
  whois_info: {
    registrar: string;
    registrar_abuse_contact_email: string;
    creation_date: string;
    expiration_date: string;
  };
  ip_info: {
    abuse_contact: string;
    asn?: {
      asn: string;
      org: string;
      country: string;
      descr?: string;
      domain?: string;
      type?: string;
      abuser_score: number;
      abuse?: string;
      route: string;
      created?: string;
      updated?: string;
    };
  };
  dns_records: {
    A: string[];
    MX: string[];
    NS: string[];
    TXT: string[];
  };
  intelligentAnalysis?: IntelligentAnalysis;
}

export type EntityTier = 'HIGH' | 'MEDIUM_HIGH' | 'MEDIUM' | 'MEDIUM_LOW' | 'LOW';

export type EntityType = 'HOSTING' | 'REGISTRAR' | 'DNS';

export interface Entity {
  name: string;
  type: EntityType;
  tier: EntityTier;
  contactInfo: string;
  priority: number;
  reason?: string;
}

export interface IntelligentAnalysis {
  affectedBrand: {
    name: string;
    type: string;
    confidence: number;
  };
  primaryTarget: Entity;
  alternativeTargets: Entity[];
  threatAssessment: {
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    indicators: string[];
    recommendation: string;
  };
  suggestedTemplate: {
    type: string;
    customizations: Record<string, string>;
  };
} 