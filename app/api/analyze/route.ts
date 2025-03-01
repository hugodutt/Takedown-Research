import { NextResponse } from 'next/server';
import { extractDomain } from '@/utils/url';
import OpenAI from 'openai';
import { DomainAnalysis, WhoisInfo, IpInfo, DnsRecords, DetectedBrand } from '@/app/types/domain';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function detectBrandFromDomain(domain: string, htmlContent: string = '', potentialBrands: string[] = []): Promise<{ 
  name: string; 
  confidence: number;
  category: string;
} | null> {
  try {
    const prompt = `Analyze this domain and HTML content to identify which brand is being targeted by this potential phishing site.

Domain: ${domain}
HTML Content:
Title: ${htmlContent}
Full Content Preview (first 2000 chars): ${htmlContent.slice(0, 2000)}
Potential Brands Found: ${potentialBrands.join(', ')}

Consider the following patterns when analyzing:
1. Domain Analysis:
   - Look for brand names or variations in the domain
   - Check for common phishing keywords (e.g., 'promo', 'secure', 'login', 'account', 'verify')
   - Identify regional/language indicators (e.g., '/Es/', '/Pt/', '/En/')
   - Look for brand-specific terms in URL paths

2. Brand-Specific Patterns:
   - Airlines:
     * Brands: LATAM, GOL, Azul, Emirates, American Airlines
     * Keywords: miles, booking, rewards, passagens, voos, milhas, pontos
     * URL patterns: 'fly', 'airlines', 'travel', 'reservas'

   - Banks & Financial:
     * Brands: Itau, Bradesco, Santander, Banco do Brasil, Caixa, Nubank, Inter
     * Keywords: conta, banco, banking, seguro, investimento, pix, cartao
     * URL patterns: 'banking', 'secure', 'conta', 'acesso', 'portal'

   - E-commerce:
     * Brands: Americanas, Magazine Luiza, Amazon, Mercado Livre, Shopee, AliExpress
     * Keywords: shop, store, compras, ofertas, produtos, frete
     * URL patterns: 'shop', 'store', 'promo', 'deals', 'black-friday'

   - Social Media:
     * Brands: Facebook, Instagram, WhatsApp, LinkedIn, X/Twitter
     * Keywords: social, connect, login, profile, messages
     * URL patterns: 'login', 'account', 'secure', 'verify'

   - Streaming:
     * Brands: Netflix, Disney+, Amazon Prime, Globoplay, HBO
     * Keywords: streaming, watch, shows, movies, series
     * URL patterns: 'watch', 'account', 'billing'

   - Delivery:
     * Brands: iFood, Rappi, Uber Eats, 99 Food
     * Keywords: delivery, pedidos, entrega, restaurantes
     * URL patterns: 'food', 'delivery', 'order'

   - Telecommunications:
     * Brands: Vivo, Claro, Tim, Oi
     * Keywords: celular, internet, planos, recarga
     * URL patterns: 'mobile', 'plans', 'recharge'

3. Content Analysis:
   - Check for copied logos and branding elements
   - Look for login forms and security seals
   - Analyze color schemes matching known brands
   - Check for trademark symbols (®, ™)
   - Identify official-looking but suspicious URLs
   - Look for mixed branding (elements from multiple brands)
   - Check for poor translations or mixed languages
   - Analyze image URLs and resources for brand references

4. Common Phishing Indicators:
   - Mixed language usage (e.g., Portuguese + English)
   - Urgency words (promocao, oferta, limitado, urgente)
   - Security-related terms (verify, secure, validate)
   - Unusual domain combinations (brand + generic terms)
   - Recent domain registration dates
   - Suspicious TLDs (.xyz, .online, .site, etc.)
   - Presence of payment/credit card forms
   - Request for sensitive information

Based on these factors:
1. Identify which brand/company is being targeted
2. Provide a confidence score (0.0 to 1.0) for this identification
3. Consider both the domain name and HTML content patterns
4. If multiple brands are referenced, identify the primary target
5. Explain the reasoning behind the identification

Respond in JSON format:
{
  "brand": "string or null",
  "confidence": number,
  "reasoning": "string explaining the identification",
  "category": "string (e.g., 'Airlines', 'Banking', 'E-commerce')",
  "indicators": ["list of specific phishing indicators found"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a phishing detection expert specialized in identifying targeted brands from website content and URLs. You have extensive knowledge of common phishing patterns, brand impersonation techniques, and social engineering tactics across multiple industries. Focus on identifying the targeted brand with high precision and explaining your reasoning clearly."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content || '{"brand": null, "confidence": 0, "reasoning": "", "category": "", "indicators": []}';
    const result = JSON.parse(content);
    
    if (!result.brand || result.confidence < 0.5) {
      console.log('Análise de marca:', result.reasoning);
      console.log('Indicadores encontrados:', result.indicators);
      return null;
    }
    
    console.log(`Marca detectada: ${result.brand} (${result.category}) - Confiança: ${result.confidence}`);
    console.log('Razão:', result.reasoning);
    console.log('Indicadores:', result.indicators);
    
    return {
      name: result.brand,
      confidence: result.confidence,
      category: result.category
    };
  } catch (error) {
    console.error('Erro ao detectar marca:', error);
    return null;
  }
}

async function analyzeHtmlContent(url: string): Promise<{
  title: string;
  description: string;
  keywords: string[];
  forms: boolean;
  loginFields: boolean;
  brandImages: boolean;
  securityIcons: boolean;
  fullContent: string;
  potentialBrands: string[];
}> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Análise básica do HTML
    const hasLoginForm = /type=["']password["']/i.test(html) || /login/i.test(html);
    const hasBrandImages = /logo|brand|marca/i.test(html);
    const hasSecurityIcons = /security|secure|ssl|lock/i.test(html);
    const hasForms = /<form/i.test(html);
    
    // Extrair meta tags e conteúdo relevante
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
    const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [];

    // Extrair texto relevante do HTML
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove CSS
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Buscar por padrões específicos que podem indicar marcas
    const potentialBrands: string[] = [];
    
    // Buscar por padrões de nome/marca
    const namePatterns = [
      /name:\s*["']([^"']+)["']/gi,
      /name=["']([^"']+)["']/gi,
      /brand:\s*["']([^"']+)["']/gi,
      /brand=["']([^"']+)["']/gi,
      /marca:\s*["']([^"']+)["']/gi,
      /marca=["']([^"']+)["']/gi,
      /store:\s*["']([^"']+)["']/gi,
      /store=["']([^"']+)["']/gi,
      /loja:\s*["']([^"']+)["']/gi,
      /loja=["']([^"']+)["']/gi
    ];

    // Lista de marcas conhecidas para buscar
    const knownBrands = [
      'netshoes', 'nike', 'adidas', 'puma', 'under armour', 'reebok',
      'mizuno', 'asics', 'new balance', 'olympikus', 'fila',
      'growth', 'max titanium', 'integral medica', 'probiotica',
      'black skull', 'darkness', 'optimum nutrition',
      'amazon', 'mercado livre', 'americanas', 'magalu', 'magazine luiza',
      'shopee', 'aliexpress', 'shein', 'casas bahia', 'submarino',
      'centauro', 'decathlon', 'dafiti'
    ];

    // Buscar por padrões de nome/marca no HTML
    for (const pattern of namePatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !potentialBrands.includes(match[1])) {
          potentialBrands.push(match[1]);
        }
      }
    }

    // Buscar por marcas conhecidas no texto completo
    for (const brand of knownBrands) {
      const regex = new RegExp(brand, 'gi');
      if (regex.test(textContent) && !potentialBrands.includes(brand)) {
        potentialBrands.push(brand);
      }
    }

    // Buscar em classes e IDs que podem conter nomes de marcas
    const classAndIdPattern = /(?:class|id)=["']([^"']*(?:brand|store|shop|marca|loja)[^"']*)["']/gi;
    const classAndIdMatches = html.matchAll(classAndIdPattern);
    for (const match of classAndIdMatches) {
      if (match[1]) {
        const words = match[1].split(/[-_\s]/);
        for (const word of words) {
          if (word.length > 3 && !potentialBrands.includes(word)) {
            potentialBrands.push(word);
          }
        }
      }
    }

    return {
      title,
      description,
      keywords,
      forms: hasForms,
      loginFields: hasLoginForm,
      brandImages: hasBrandImages,
      securityIcons: hasSecurityIcons,
      fullContent: textContent,
      potentialBrands: potentialBrands.filter(brand => brand.length > 3)
    };
  } catch (error) {
    console.error('Erro ao analisar HTML:', error);
    return {
      title: '',
      description: '',
      keywords: [],
      forms: false,
      loginFields: false,
      brandImages: false,
      securityIcons: false,
      fullContent: '',
      potentialBrands: []
    };
  }
}

function generateTakedownText(data: any) {
  const brand = data.detected_brand?.name || 'Unknown Brand';
  const category = data.brand_category || 'Unknown Category';
  const indicators = data.phishing_indicators || [];
  const registrationDate = data.whois_info?.creation_date || 'N/A';

  // Função para gerar descrição contextualizada baseada na categoria
  function getCategoryContext(category: string, brand: string): string {
    switch (category.toLowerCase()) {
      case 'banking':
      case 'banks & financial':
        return `This fraudulent website is impersonating ${brand} to steal sensitive financial information from customers. The phishing site attempts to trick users into providing their banking credentials, potentially leading to financial losses and identity theft.`;
      case 'airlines':
        return `This fraudulent website is impersonating ${brand} airlines, attempting to steal customers' personal information and payment details. The site mimics legitimate airline booking processes to deceive users seeking to purchase tickets or manage their miles/rewards.`;
      case 'e-commerce':
        return `This fraudulent website is impersonating ${brand}'s e-commerce platform, putting online shoppers at risk. The site attempts to steal payment information and personal data from customers who believe they are making legitimate purchases.`;
      case 'social media':
        return `This fraudulent website is impersonating ${brand}'s platform, attempting to steal users' login credentials and personal information. The site poses a significant risk to users' privacy and could lead to account compromise and identity theft.`;
      case 'streaming':
        return `This fraudulent website is impersonating ${brand}'s streaming service, attempting to steal users' subscription credentials and payment information. The site tricks users into providing their account details, potentially leading to unauthorized charges and account theft.`;
      case 'delivery':
        return `This fraudulent website is impersonating ${brand}'s delivery service, putting both customers and restaurants at risk. The site attempts to steal payment information and personal data while posing as a legitimate food delivery platform.`;
      case 'telecommunications':
        return `This fraudulent website is impersonating ${brand}'s telecommunications services, attempting to steal customers' account credentials and payment information. The site poses as a legitimate service provider to deceive users managing their mobile or internet services.`;
      default:
        return `This fraudulent website is impersonating ${brand} and was created with the intention of stealing sensitive information from their customers.`;
    }
  }

  // Função para descrever os indicadores de forma mais natural
  function describeIndicators(indicators: string[]): string {
    if (!indicators.length) return '';

    const descriptions = [];
    
    // Agrupa indicadores similares
    if (indicators.some(i => i.includes('login') || i.includes('senha'))) {
      descriptions.push('implements fake login forms to capture user credentials');
    }
    if (indicators.some(i => i.includes('marca') || i.includes('logo'))) {
      descriptions.push('unauthorized use of brand logos and trademarks');
    }
    if (indicators.some(i => i.includes('segurança'))) {
      descriptions.push('displays fake security seals to appear legitimate');
    }
    if (indicators.some(i => i.includes('recentemente'))) {
      descriptions.push('was registered recently, typical of phishing campaigns');
    }

    return descriptions.join(', ');
  }

  const categoryContext = getCategoryContext(category, brand);
  const indicatorDescription = describeIndicators(indicators);

  return `Subject: [URGENT] Phishing Site Takedown Request - ${data.domain}

Dear Abuse Team,

We have identified a sophisticated phishing operation targeting ${brand} customers through the following domain:

Domain: ${data.domain}
IP Address: ${data.ip}

${categoryContext}

Our security analysis has revealed that this fraudulent site ${indicatorDescription}. This poses an immediate threat to unsuspecting users who may fall victim to this scam.

The timing and nature of this attack is particularly concerning, as it coincides with ${brand}'s legitimate services and exploits their trusted reputation in the ${category} sector.

We urgently request your immediate action to take down this malicious content and protect potential victims from this fraudulent scheme.

Your swift response in this matter is crucial to prevent further compromise of user data and maintain the integrity of online services.

Thank you for your immediate attention to this critical security threat.

Best regards,
Anti-Phishing Team`;
}

async function getIpAddress(domain: string): Promise<string | null> {
  try {
    // Primeiro tenta usar o Google DNS
    const googleDnsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    const googleDnsData = await googleDnsResponse.json();
    
    if (googleDnsData.Answer && googleDnsData.Answer[0]?.data) {
      console.log('IP obtido via Google DNS:', googleDnsData.Answer[0].data);
      return googleDnsData.Answer[0].data;
    }

    // Se falhar, tenta usar o Cloudflare DNS
    const cloudflareDnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    const cloudflareDnsData = await cloudflareDnsResponse.json();
    
    if (cloudflareDnsData.Answer && cloudflareDnsData.Answer[0]?.data) {
      console.log('IP obtido via Cloudflare DNS:', cloudflareDnsData.Answer[0].data);
      return cloudflareDnsData.Answer[0].data;
    }

    // Se ainda falhar, tenta resolver usando um servidor DNS alternativo
    const quad9DnsResponse = await fetch(`https://dns.quad9.net:5053/dns-query?name=${domain}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    const quad9DnsData = await quad9DnsResponse.json();
    
    if (quad9DnsData.Answer && quad9DnsData.Answer[0]?.data) {
      console.log('IP obtido via Quad9 DNS:', quad9DnsData.Answer[0].data);
      return quad9DnsData.Answer[0].data;
    }

    console.log('Não foi possível obter o IP usando nenhum dos serviços DNS');
    return null;
  } catch (error) {
    console.error('Erro ao obter IP:', error);
    return null;
  }
}

async function getWhoisInfo(domain: string): Promise<any> {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 segundo

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Remove apenas www. do início do domínio, mantendo o domínio completo
      const baseDomain = domain.replace(/^www\./, '');
      console.log(`Consultando WHOIS para domínio: ${baseDomain} (tentativa ${attempt + 1}/${maxRetries})`);

      // Remover protocolo e path, manter apenas o domínio base
      const cleanDomain = baseDomain.replace(/^https?:\/\//, '').split('/')[0];
      console.log('Domínio limpo para consulta WHOIS:', cleanDomain);

      const whoisResponse = await fetch(`https://api.apilayer.com/whois/query?domain=${cleanDomain}`, {
        method: 'GET',
        headers: {
          'apikey': 'U7DXr83jjZ4v8idMPCYwVDm1o6pAUbt0'
        }
      });

      if (!whoisResponse.ok) {
        // Se for erro 524 ou 5xx, tenta novamente
        if (whoisResponse.status === 524 || (whoisResponse.status >= 500 && whoisResponse.status < 600)) {
          console.log(`Erro ${whoisResponse.status} recebido, tentando novamente em ${(baseDelay * (attempt + 1))/1000} segundos...`);
          await new Promise(resolve => setTimeout(resolve, baseDelay * (attempt + 1)));
          continue;
        }
        
        // Log do erro completo para debug
        const errorText = await whoisResponse.text();
        console.error('Erro detalhado da APILayer:', errorText);
        throw new Error(`HTTP error! status: ${whoisResponse.status}, details: ${errorText}`);
      }

      const whoisData = await whoisResponse.json();
      console.log('Resposta da APILayer:', whoisData); // Debug
      
      // Ajuste na verificação da resposta
      if (!whoisData || !whoisData.result) {
        throw new Error('Invalid WHOIS response');
      }

      const result = whoisData.result;

      return {
        registrar: result.registrar || 'N/A',
        creation_date: result.creation_date || 'N/A',
        expiration_date: result.expiration_date || 'N/A',
        nameservers: result.name_servers || ['N/A'],
        registrar_abuse_contact_email: result.emails || 'N/A',
        raw: JSON.stringify(whoisData)
      };

    } catch (error) {
      console.error(`Erro ao consultar WHOIS (tentativa ${attempt + 1}/${maxRetries}):`, error);
      
      // Se for a última tentativa, retorna o objeto de erro
      if (attempt === maxRetries - 1) {
        return {
          registrar: 'N/A',
          creation_date: 'N/A',
          expiration_date: 'N/A',
          nameservers: ['N/A'],
          registrar_abuse_contact_email: 'N/A',
          raw: ''
        };
      }
      
      // Espera antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, baseDelay * (attempt + 1)));
    }
  }
}

// Nova função para gerar relatório de análise detalhado
function generateAnalysisReport(data: any) {
  const brand = data.detected_brand?.name || 'Unknown Brand';
  const category = data.brand_category || 'Unknown Category';
  const indicators = data.phishing_indicators || [];
  const registrationDate = data.whois_info?.creation_date || 'N/A';

  // Determinar nível de risco baseado em indicadores
  let riskLevel = '🟡 MÉDIO';
  let riskColor = '🟡';
  if (indicators.length > 5) {
    riskLevel = '🔴 ALTO';
    riskColor = '🔴';
  } else if (indicators.length < 3) {
    riskLevel = '🟢 BAIXO';
    riskColor = '🟢';
  }

  // Categorizar indicadores
  const categories = {
    authentication: indicators.filter((i: string) => i.includes('login') || i.includes('senha') || i.includes('form')),
    brand: indicators.filter((i: string) => i.includes('marca') || i.includes('logo') || i.includes('imagem')),
    technical: indicators.filter((i: string) => i.includes('ssl') || i.includes('dns') || i.includes('registro')),
    behavioral: indicators.filter((i: string) => i.includes('recente') || i.includes('suspeito') || i.includes('similar'))
  };

  // Gerar badges de status
  const statusBadges = [];
  if (indicators.some((i: string) => i.includes('login'))) statusBadges.push('🔒 Roubo de Credenciais');
  if (indicators.some((i: string) => i.includes('marca'))) statusBadges.push('🏢 Brand Abuse');
  if (indicators.some((i: string) => i.includes('recente'))) statusBadges.push('⚡ Campanha Ativa');
  if (indicators.some((i: string) => i.includes('ssl'))) statusBadges.push('🔐 SSL Malicioso');

  // Determinar descrição baseada na categoria
  let categoryDescription = '';
  switch(category.toLowerCase()) {
    case 'banking':
    case 'banks & financial':
      categoryDescription = `🏦 Campanha de phishing direcionada a clientes do ${brand}. Tentativa de roubo de credenciais bancárias e dados financeiros.`;
      break;
    case 'airlines':
      categoryDescription = `✈️ Operação fraudulenta visando clientes da ${brand}. Foco em roubo de dados de cartão e milhas aéreas.`;
      break;
    case 'e-commerce':
      categoryDescription = `🛒 Campanha maliciosa imitando a plataforma ${brand}. Objetivo de capturar dados de pagamento de compradores.`;
      break;
    case 'social media':
      categoryDescription = `📱 Ataque direcionado a usuários do ${brand}. Tentativa de comprometimento de contas e roubo de dados pessoais.`;
      break;
    case 'streaming':
      categoryDescription = `🎬 Campanha fraudulenta visando usuários do ${brand}. Tentativa de roubo de credenciais de streaming.`;
      break;
    case 'delivery':
      categoryDescription = `🛵 Ataque direcionado a usuários do ${brand}. Foco em roubo de dados de pagamento e credenciais.`;
      break;
    default:
      categoryDescription = `🎯 Campanha de phishing detectada visando a marca ${brand}.`;
  }

  return `⚠️ RELATÓRIO DE ANÁLISE DE AMEAÇA
═══════════════════════════════
${riskColor} Nível de Risco: ${riskLevel}
${statusBadges.length > 0 ? statusBadges.join(' | ') : ''}

🎯 Alvo Identificado
• Marca: ${brand}
• Categoria: ${category}
• Data Registro: ${registrationDate}

📝 Resumo da Análise
${categoryDescription}

🚨 Indicadores de Ameaça
${categories.authentication.length > 0 ? `🔐 Autenticação
${categories.authentication.map((i: string) => `• ${i}`).join('\n')}` : ''}
${categories.authentication.length > 0 && (categories.brand.length > 0 || categories.technical.length > 0 || categories.behavioral.length > 0) ? '\n' : ''}${categories.brand.length > 0 ? `🏢 Abuso de Marca
${categories.brand.map((i: string) => `• ${i}`).join('\n')}` : ''}
${categories.brand.length > 0 && (categories.technical.length > 0 || categories.behavioral.length > 0) ? '\n' : ''}${categories.technical.length > 0 ? `⚙️ Indicadores Técnicos
${categories.technical.map((i: string) => `• ${i}`).join('\n')}` : ''}
${categories.technical.length > 0 && categories.behavioral.length > 0 ? '\n' : ''}${categories.behavioral.length > 0 ? `🔍 Padrões Comportamentais
${categories.behavioral.map((i: string) => `• ${i}`).join('\n')}` : ''}

📊 Métricas de Impacto
• Severidade: ${riskLevel}
• Indicadores Detectados: ${indicators.length}
• Localização: ${data.ip_info?.asn?.country || 'Desconhecida'}

⚡ Status: ${indicators.length > 0 ? 'Ameaça Ativa' : 'Em Análise'}

Análise gerada por sistema automatizado de detecção de ameaças.`;
}

async function analyzeUrl(url: string): Promise<DomainAnalysis> {
  try {
    const data = await request.json() as { url: string };
    const url = data.url;
    
    if (!url) {
      return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 }) as any;
    }

    console.log('Recebida requisição para analisar:', url);
    
    // Validar URL
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 }) as any;
    }

    // Extrair domínio
    const domain = extractDomain(url);
    if (!domain) {
      return NextResponse.json({ error: 'Não foi possível extrair o domínio da URL' }, { status: 400 }) as any;
    }
    console.log('Domínio extraído:', domain);

    // Analisar conteúdo HTML com tratamento de erro
    let htmlAnalysis;
    try {
      htmlAnalysis = await analyzeHtmlContent(url);
    } catch (error) {
      console.error('Erro ao analisar HTML:', error);
      htmlAnalysis = {
        title: '',
        description: '',
        keywords: [],
        forms: false,
        loginFields: false,
        brandImages: false,
        securityIcons: false,
        fullContent: '',
        potentialBrands: []
      };
    }

    // Detectar marca do domínio
    let detectedBrand = null;
    try {
      detectedBrand = await detectBrandFromDomain(domain, htmlAnalysis.title + htmlAnalysis.description, htmlAnalysis.potentialBrands);
    } catch (error) {
      console.error('Erro ao detectar marca:', error);
    }
    
    // Obter IP usando múltiplas fontes com retry
    console.log('Obtendo endereço IP...');
    let ip = null;
    let retryCount = 0;
    while (!ip && retryCount < 3) {
      try {
        ip = await getIpAddress(domain);
        if (ip) break;
      } catch (error) {
        console.error(`Tentativa ${retryCount + 1} falhou ao obter IP:`, error);
      }
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo entre tentativas
    }
    console.log('IP obtido:', ip);

    if (!ip) {
      return NextResponse.json({
        error: 'Não foi possível obter o IP do domínio após múltiplas tentativas'
      }, { status: 400 }) as any;
    }

    // Consultar WHOIS com retry
    console.log('Consultando WHOIS...');
    let whoisInfo = null;
    retryCount = 0;
    while (!whoisInfo && retryCount < 3) {
      try {
        whoisInfo = await getWhoisInfo(domain);
        if (whoisInfo && whoisInfo.registrar !== 'N/A') break;
      } catch (error) {
        console.error(`Tentativa ${retryCount + 1} falhou ao consultar WHOIS:`, error);
      }
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!whoisInfo) {
      whoisInfo = {
        registrar: 'N/A',
        creation_date: 'N/A',
        expiration_date: 'N/A',
        nameservers: ['N/A'],
        registrar_abuse_contact_email: 'N/A',
        raw: ''
      };
    }
    console.log('Informações WHOIS:', whoisInfo);

    // Consultar informações detalhadas do IP usando ipapi.is com API KEY
    console.log('Consultando informações detalhadas do IP...');
    const IPAPI_IS_KEY = '70a7f3f869cfd36a';
    let ipapiIsInfo = null;
    
    if (ip !== 'N/A') {
      try {
        const ipapiIsResponse = await fetch('https://api.ipapi.is', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            q: ip,
            key: IPAPI_IS_KEY
          })
        });
        
        if (!ipapiIsResponse.ok) {
          throw new Error(`HTTP error! status: ${ipapiIsResponse.status}`);
        }
        
        const responseText = await ipapiIsResponse.text();
        console.log('Resposta bruta IPAPI.is:', responseText);
        
        try {
          ipapiIsInfo = JSON.parse(responseText);
        } catch (e) {
          console.error('Erro ao fazer parse da resposta:', e);
        }
        
        console.log('Resposta IPAPI.is processada:', ipapiIsInfo);
      } catch (error) {
        console.error('Erro ao consultar IPAPI.is:', error);
      }
    }

    // Determinar o Hosting Provider e informações de abuso
    const hostingProvider = ipapiIsInfo?.company?.name || 'N/A';
    const abuseInfo = {
      name: ipapiIsInfo?.abuse?.name || whoisInfo.registrar || 'N/A',
      email: ipapiIsInfo?.abuse?.email || whoisInfo.registrar_abuse_contact_email || 'N/A',
      phone: ipapiIsInfo?.abuse?.phone || whoisInfo.raw.match(/Registrar Abuse Contact Phone:\s*([^\n]+)/)?.[1] || 'N/A',
      address: ipapiIsInfo?.abuse?.address || 'N/A'
    };

    // Obter registros DNS com mais detalhes
    console.log('Obtendo registros DNS...');
    const [a, mx, ns, txt] = await Promise.all([
      fetch(`https://dns.google/resolve?name=${domain}&type=A`).then(r => r.json()),
      fetch(`https://dns.google/resolve?name=${domain}&type=MX`).then(r => r.json()),
      fetch(`https://dns.google/resolve?name=${domain}&type=NS`).then(r => r.json()),
      fetch(`https://dns.google/resolve?name=${domain}&type=TXT`).then(r => r.json())
    ]);

    const dns_records = {
      A: a.Answer?.map((record: any) => record.data) || [],
      MX: mx.Answer?.map((record: any) => record.data) || [],
      NS: ns.Answer?.map((record: any) => record.data) || [],
      TXT: txt.Answer?.map((record: any) => record.data) || []
    };

    // Identificar indicadores de phishing
    const phishingIndicators = [];
    
    if (htmlAnalysis.loginFields) phishingIndicators.push('Campos de login detectados');
    if (htmlAnalysis.brandImages) phishingIndicators.push('Imagens de marca detectadas');
    if (htmlAnalysis.securityIcons) phishingIndicators.push('Ícones de segurança suspeitos');
    if (detectedBrand) phishingIndicators.push(`Uso não autorizado da marca ${detectedBrand.name}`);
    if (whoisInfo.creation_date !== 'N/A' && new Date(whoisInfo.creation_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      phishingIndicators.push('Domínio registrado recentemente');
    }

    // Preparar resposta final com todas as informações
    const response: DomainAnalysis = {
      url,
      ip,
      whois_info: whoisInfo,
      ip_info: {
        ip,
        abuse_contact: abuseInfo.email,
        asn: {
          asn: ipapiIsInfo?.asn?.asn || 'N/A',
          org: ipapiIsInfo?.asn?.org || 'N/A',
          route: ipapiIsInfo?.asn?.route || 'N/A',
          country: ipapiIsInfo?.asn?.country || 'N/A'
        }
      },
      dns_records,
      html_analysis: htmlAnalysis,
      detected_brand: detectedBrand,
      brand_category: detectedBrand?.category || 'Unknown',
      phishing_indicators: phishingIndicators,
      risk_score: detectedBrand ? 0.9 : 0.5,
      analysis_text: generateAnalysisReport({
        detected_brand: detectedBrand,
        brand_category: detectedBrand?.category || 'Unknown',
        whois_info: whoisInfo,
        ip_info: {
          asn: {
            country: ipapiIsInfo?.asn?.country
          }
        },
        phishing_indicators: phishingIndicators
      }),
      takedown_text: generateTakedownText({
        domain,
        ip,
        detected_brand: detectedBrand,
        brand_category: detectedBrand?.category || 'Unknown',
        phishing_indicators
      })
    };

    console.log('Resposta final:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro na análise:', error);
    return NextResponse.json(
      { 
        url: '',
        ip: '',
        whois_info: {},
        ip_info: { ip: '' },
        dns_records: {},
        risk_score: 0,
        phishing_indicators: [],
        takedown_text: '',
        error: error instanceof Error ? error.message : 'Erro ao analisar domínio'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request): Promise<NextResponse<DomainAnalysis>> {
  try {
    const { url } = await req.json() as { url: string };
    
    if (!url) {
      const errorResponse: DomainAnalysis = {
        url: '',
        ip: '',
        whois_info: { domain_name: '' },
        ip_info: { ip: '', abuse_contact: '', asn: { asn: '', org: '', route: '', country: '' } },
        dns_records: {
          a: [],
          aaaa: [],
          mx: [],
          ns: [],
          txt: [],
          soa: [],
          ptr: [],
          srv: [],
          cname: []
        },
        detected_brand: undefined,
        brand_category: undefined,
        risk_score: 0,
        phishing_indicators: [],
        takedown_text: ''
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    console.log('Recebida requisição para analisar:', url);
    
    // Validar URL
    try {
      new URL(url);
    } catch (e) {
      const errorResponse: DomainAnalysis = {
        url: '',
        ip: '',
        whois_info: { domain_name: '' },
        ip_info: { ip: '', abuse_contact: '', asn: { asn: '', org: '', route: '', country: '' } },
        dns_records: {
          a: [],
          aaaa: [],
          mx: [],
          ns: [],
          txt: [],
          soa: [],
          ptr: [],
          srv: [],
          cname: []
        },
        detected_brand: undefined,
        brand_category: undefined,
        risk_score: 0,
        phishing_indicators: [],
        takedown_text: ''
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Extrair domínio
    const domain = extractDomain(url);
    if (!domain) {
      const errorResponse: DomainAnalysis = {
        url: '',
        ip: '',
        whois_info: { domain_name: '' },
        ip_info: { ip: '', abuse_contact: '', asn: { asn: '', org: '', route: '', country: '' } },
        dns_records: {
          a: [],
          aaaa: [],
          mx: [],
          ns: [],
          txt: [],
          soa: [],
          ptr: [],
          srv: [],
          cname: []
        },
        detected_brand: undefined,
        brand_category: undefined,
        risk_score: 0,
        phishing_indicators: [],
        takedown_text: ''
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    console.log('Domínio extraído:', domain);

    // Análise do domínio
    const ip = await getIpAddress(domain);
    const whoisInfo = await getWhoisInfo(domain);
    const dnsRecords = await getDnsRecords(domain);
    const ipInfo = await getIpInfo(ip);
    const detectedBrand = await detectBrand(domain);
    const phishingIndicators = await analyzePhishingIndicators(domain);

    const response: DomainAnalysis = {
      url,
      ip,
      whois_info: whoisInfo,
      ip_info: {
        ip,
        abuse_contact: ipInfo.abuse_contact || 'N/A',
        asn: {
          asn: ipInfo.asn?.asn || 'N/A',
          org: ipInfo.asn?.org || 'N/A',
          route: ipInfo.asn?.route || 'N/A',
          country: ipInfo.asn?.country || 'N/A'
        }
      },
      dns_records: dnsRecords,
      detected_brand: detectedBrand,
      brand_category: detectedBrand?.category,
      risk_score: detectedBrand ? 0.9 : 0.5,
      phishing_indicators,
      takedown_text: generateTakedownText({
        domain,
        ip,
        detected_brand: detectedBrand,
        brand_category: detectedBrand?.category || 'Unknown',
        phishing_indicators
      })
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro na análise:', error);
    const errorResponse: DomainAnalysis = {
      url: '',
      ip: '',
      whois_info: { domain_name: '' },
      ip_info: { ip: '', abuse_contact: '', asn: { asn: '', org: '', route: '', country: '' } },
      dns_records: {
        a: [],
        aaaa: [],
        mx: [],
        ns: [],
        txt: [],
        soa: [],
        ptr: [],
        srv: [],
        cname: []
      },
      detected_brand: undefined,
      brand_category: undefined,
      risk_score: 0,
      phishing_indicators: [],
      takedown_text: ''
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}