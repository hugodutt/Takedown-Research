import { NextResponse } from 'next/server';

interface DnsRecord {
  data: string;
}

interface DnsResponse {
  Answer?: DnsRecord[];
}

interface WhoisInfo {
  domain_name: string;
  creation_date?: string;
}

interface IpInfo {
  ip: string;
  abuse_contact: string;
  asn: {
    asn: string;
    org: string;
    route: string;
    country: string;
  };
}

interface DetectedBrand {
  name: string;
  confidence: number;
  category: string;
}

interface DnsRecords {
  a: string[];
  aaaa: string[];
  mx: string[];
  ns: string[];
  txt: string[];
  soa: string[];
  ptr: string[];
  srv: string[];
  cname: string[];
}

interface DomainAnalysis {
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

async function getIpAddress(domain: string): Promise<string | null> {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    const data = await response.json() as DnsResponse;
    return data.Answer?.[0]?.data || null;
  } catch (err) {
    console.error('Error getting IP address:', err);
    return null;
  }
}

async function getWhoisInfo(domain: string): Promise<WhoisInfo> {
  try {
    const response = await fetch(`https://whois.whoisxmlapi.com/api/v1?apiKey=${process.env.WHOIS_API_KEY}&domainName=${domain}`);
    const data = await response.json();
    return {
      domain_name: data.domainName || domain,
      creation_date: data.createdDate
    };
  } catch (err) {
    console.error('Error getting WHOIS info:', err);
    return {
      domain_name: domain
    };
  }
}

async function getDnsRecords(domain: string): Promise<DnsRecords> {
  try {
    const [a, aaaa, mx, ns, txt, soa, ptr, srv, cname] = await Promise.all([
      fetch(`https://dns.google/resolve?name=${domain}&type=A`).then(r => r.json()) as Promise<DnsResponse>,
      fetch(`https://dns.google/resolve?name=${domain}&type=AAAA`).then(r => r.json()) as Promise<DnsResponse>,
      fetch(`https://dns.google/resolve?name=${domain}&type=MX`).then(r => r.json()) as Promise<DnsResponse>,
      fetch(`https://dns.google/resolve?name=${domain}&type=NS`).then(r => r.json()) as Promise<DnsResponse>,
      fetch(`https://dns.google/resolve?name=${domain}&type=TXT`).then(r => r.json()) as Promise<DnsResponse>,
      fetch(`https://dns.google/resolve?name=${domain}&type=SOA`).then(r => r.json()) as Promise<DnsResponse>,
      fetch(`https://dns.google/resolve?name=${domain}&type=PTR`).then(r => r.json()) as Promise<DnsResponse>,
      fetch(`https://dns.google/resolve?name=${domain}&type=SRV`).then(r => r.json()) as Promise<DnsResponse>,
      fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`).then(r => r.json()) as Promise<DnsResponse>
    ]);

    return {
      a: a.Answer?.map((record: DnsRecord) => record.data) || [],
      aaaa: aaaa.Answer?.map((record: DnsRecord) => record.data) || [],
      mx: mx.Answer?.map((record: DnsRecord) => record.data) || [],
      ns: ns.Answer?.map((record: DnsRecord) => record.data) || [],
      txt: txt.Answer?.map((record: DnsRecord) => record.data) || [],
      soa: soa.Answer?.map((record: DnsRecord) => record.data) || [],
      ptr: ptr.Answer?.map((record: DnsRecord) => record.data) || [],
      srv: srv.Answer?.map((record: DnsRecord) => record.data) || [],
      cname: cname.Answer?.map((record: DnsRecord) => record.data) || []
    };
  } catch (err) {
    console.error('Error getting DNS records:', err);
    return {
      a: [],
      aaaa: [],
      mx: [],
      ns: [],
      txt: [],
      soa: [],
      ptr: [],
      srv: [],
      cname: []
    };
  }
}

async function getIpInfo(ip: string): Promise<IpInfo> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    return {
      ip,
      abuse_contact: data.abuse_contact || 'N/A',
      asn: {
        asn: data.asn || 'N/A',
        org: data.org || 'N/A',
        route: data.network || 'N/A',
        country: data.country_code || 'N/A'
      }
    };
  } catch (err) {
    console.error('Error getting IP info:', err);
    return {
      ip,
      abuse_contact: 'N/A',
      asn: {
        asn: 'N/A',
        org: 'N/A',
        route: 'N/A',
        country: 'N/A'
      }
    };
  }
}

async function detectBrand(domain: string): Promise<DetectedBrand | undefined> {
  try {
    const commonBrands = [
      { name: 'PayPal', pattern: /paypal/i, category: 'Payment' },
      { name: 'Microsoft', pattern: /microsoft|office|outlook|hotmail/i, category: 'Technology' },
      { name: 'Google', pattern: /google|gmail/i, category: 'Technology' },
      { name: 'Apple', pattern: /apple|icloud/i, category: 'Technology' },
      { name: 'Amazon', pattern: /amazon/i, category: 'E-commerce' },
      { name: 'Facebook', pattern: /facebook|instagram|whatsapp/i, category: 'Social Media' },
      { name: 'Netflix', pattern: /netflix/i, category: 'Entertainment' },
      { name: 'Bank of America', pattern: /bankofamerica|bofa/i, category: 'Banking' }
    ];

    for (const brand of commonBrands) {
      if (brand.pattern.test(domain)) {
        return {
          name: brand.name,
          confidence: 0.9,
          category: brand.category
        };
      }
    }

    return undefined;
  } catch (err) {
    console.error('Error detecting brand:', err);
    return undefined;
  }
}

async function analyzePhishingIndicators(domain: string): Promise<string[]> {
  const indicators: string[] = [];
  
  try {
    const whois = await getWhoisInfo(domain);
    if (whois.creation_date) {
      const creationDate = new Date(whois.creation_date);
      const now = new Date();
      const ageInDays = Math.floor((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (ageInDays < 30) {
        indicators.push('Domain registered less than 30 days ago');
      }
    }

    const suspiciousTLDs = ['.xyz', '.top', '.work', '.date', '.loan', '.agency'];
    if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
      indicators.push('Suspicious TLD detected');
    }

    const detectedBrand = await detectBrand(domain);
    if (detectedBrand) {
      indicators.push(`Potential ${detectedBrand.name} impersonation`);
    }

    return indicators;
  } catch (err) {
    console.error('Error analyzing phishing indicators:', err);
    return [];
  }
}

function generateTakedownText(params: {
  domain: string;
  ip: string;
  detected_brand?: DetectedBrand;
  brand_category?: string;
  phishing_indicators: string[];
  whois_info: WhoisInfo;
}): string {
  const {
    domain,
    ip,
    detected_brand,
    brand_category,
    phishing_indicators,
    whois_info
  } = params;

  return `
Dear Abuse Team,

I am writing to report a potentially malicious website that requires immediate attention:

Domain: ${domain}
IP Address: ${ip}
${detected_brand ? `Targeted Brand: ${detected_brand.name}` : ''}
${brand_category ? `Category: ${brand_category}` : ''}

Risk Indicators:
${phishing_indicators.map(indicator => `- ${indicator}`).join('\n')}

Domain Information:
- Registration Date: ${whois_info.creation_date || 'N/A'}

Please take appropriate action to investigate and mitigate any potential threats associated with this domain.

Best regards,
Security Team
`;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    const ip = await getIpAddress(domain);
    const whoisInfo = await getWhoisInfo(domain);
    const dnsRecords = await getDnsRecords(domain);
    const ipInfo = await getIpInfo(ip || '');
    const detectedBrand = await detectBrand(domain);
    const phishingIndicators = await analyzePhishingIndicators(domain);

    const response: DomainAnalysis = {
      url,
      ip: ip || '',
      whois_info: whoisInfo,
      ip_info: ipInfo,
      dns_records: dnsRecords,
      detected_brand: detectedBrand,
      brand_category: detectedBrand?.category,
      risk_score: detectedBrand ? 0.9 : 0.5,
      phishing_indicators: phishingIndicators,
      takedown_text: generateTakedownText({
        domain,
        ip: ip || '',
        detected_brand: detectedBrand,
        brand_category: detectedBrand?.category,
        phishing_indicators: phishingIndicators,
        whois_info: whoisInfo
      })
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error analyzing domain:', err);
    return NextResponse.json({ error: 'Failed to analyze domain' }, { status: 500 });
  }
}