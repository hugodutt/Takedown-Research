import { NextResponse } from 'next/server';
import { EntityType, EntityTier, Entity, IntelligentAnalysis } from '@/types/domain';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface EntityInfo {
  tier: EntityTier;
  responseTime: string;
  effectiveness: string;
}

interface EntityDatabase {
  hosting: Record<string, EntityInfo>;
  registrar: Record<string, EntityInfo>;
  dns: Record<string, EntityInfo>;
}

// Base de conhecimento sobre entidades
const entityKnowledge: EntityDatabase = {
  hosting: {
    'Amazon AWS': { tier: 'HIGH', responseTime: 'fast', effectiveness: 'high' },
    'Google Cloud': { tier: 'HIGH', responseTime: 'fast', effectiveness: 'high' },
    'Microsoft Azure': { tier: 'HIGH', responseTime: 'fast', effectiveness: 'high' },
    'DigitalOcean': { tier: 'MEDIUM_HIGH', responseTime: 'medium', effectiveness: 'medium' },
    'OVH': { tier: 'MEDIUM', responseTime: 'medium', effectiveness: 'medium' },
  },
  registrar: {
    'GoDaddy': { tier: 'MEDIUM_HIGH', responseTime: 'medium', effectiveness: 'medium' },
    'Namecheap': { tier: 'MEDIUM', responseTime: 'slow', effectiveness: 'low' },
    'CloudFlare': { tier: 'HIGH', responseTime: 'fast', effectiveness: 'high' },
  },
  dns: {
    'Cloudflare': { tier: 'HIGH', responseTime: 'fast', effectiveness: 'high' },
    'Google DNS': { tier: 'HIGH', responseTime: 'fast', effectiveness: 'high' },
    'AWS Route53': { tier: 'HIGH', responseTime: 'fast', effectiveness: 'high' },
  }
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { domain, whois, ipInfo, dns_records, detectedBrand, indicators } = data;

    // Preparar o prompt para o GPT
    const prompt = `Analise os seguintes dados de um domínio suspeito e determine a melhor estratégia de takedown:

Domain: ${domain}
IP: ${ipInfo?.ip || 'Unknown'}
Detected Brand: ${detectedBrand?.name || 'Unknown'}
Brand Type: ${detectedBrand?.type || 'Unknown'}
Phishing Indicators: ${indicators.join(', ')}

WHOIS Information:
${JSON.stringify(whois, null, 2)}

DNS Records:
${JSON.stringify(dns_records, null, 2)}

IP Information:
${JSON.stringify(ipInfo, null, 2)}

Com base nesses dados:
1. Identifique a entidade mais efetiva para realizar o takedown (hosting, registrar, ou DNS)
2. Avalie a severidade da ameaça
3. Sugira abordagens alternativas caso a primeira opção falhe
4. Indique o melhor template a ser usado baseado no tipo de violação e entidade

Responda em JSON com o seguinte formato:
{
  "primaryTarget": {
    "type": "HOSTING|REGISTRAR|DNS",
    "name": "nome da entidade",
    "reason": "justificativa detalhada"
  },
  "severity": "HIGH|MEDIUM|LOW",
  "alternativeApproaches": [
    {
      "type": "HOSTING|REGISTRAR|DNS",
      "name": "nome da entidade",
      "reason": "justificativa"
    }
  ],
  "templateType": "tipo do template sugerido"
}`;

    // Fazer a chamada para o GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em análise de domínios maliciosos e estratégias de takedown."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    // Garantir que a resposta não é nula
    const content = completion.choices[0].message.content || '{}';
    const gptAnalysis = JSON.parse(content);

    // Processar a resposta do GPT e criar a análise inteligente
    const intelligentAnalysis: IntelligentAnalysis = {
      affectedBrand: {
        name: detectedBrand?.name || 'Unknown',
        type: detectedBrand?.type || 'Unknown',
        confidence: indicators.length > 0 ? 0.8 : 0.5
      },
      primaryTarget: {
        name: gptAnalysis.primaryTarget.name,
        type: gptAnalysis.primaryTarget.type as EntityType,
        tier: determineEntityTier(gptAnalysis.primaryTarget.name, gptAnalysis.primaryTarget.type),
        contactInfo: extractContactInfo(gptAnalysis.primaryTarget.type, whois, ipInfo),
        priority: 1,
        reason: gptAnalysis.primaryTarget.reason
      },
      alternativeTargets: gptAnalysis.alternativeApproaches.map((approach: any, index: number) => ({
        name: approach.name,
        type: approach.type as EntityType,
        tier: determineEntityTier(approach.name, approach.type),
        contactInfo: extractContactInfo(approach.type, whois, ipInfo),
        priority: index + 2,
        reason: approach.reason
      })),
      threatAssessment: {
        severity: gptAnalysis.severity,
        indicators,
        recommendation: gptAnalysis.primaryTarget.reason
      },
      suggestedTemplate: {
        type: gptAnalysis.templateType,
        customizations: {
          brandName: detectedBrand?.name || '',
          entityName: gptAnalysis.primaryTarget.name,
          domain: domain,
          evidences: indicators.join(', ')
        }
      }
    };

    return NextResponse.json(intelligentAnalysis);
  } catch (error) {
    console.error('Error in intelligent analysis:', error);
    return NextResponse.json(
      { error: 'Failed to perform intelligent analysis' },
      { status: 500 }
    );
  }
}

function determineEntityTier(name: string, type: string): EntityTier {
  const lowerType = type.toLowerCase() as keyof EntityDatabase;
  const knowledge = entityKnowledge[lowerType];
  
  if (knowledge && knowledge[name]) {
    return knowledge[name].tier;
  }
  
  return 'MEDIUM';
}

function extractContactInfo(type: string, whois: any, ipInfo: any): string {
  switch (type) {
    case 'HOSTING':
      return ipInfo?.abuse || '';
    case 'REGISTRAR':
      return whois?.registrar?.abuse_contact || '';
    case 'DNS':
      return whois?.nameservers?.abuse_contact || '';
    default:
      return '';
  }
} 