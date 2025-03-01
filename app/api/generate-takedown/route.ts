import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { domain, ip, detectedBrand, indicators, whois, ipInfo, dns_records, primaryTarget, severity, templateType, phishing_indicators, html_analysis } = data;

    // Preparar o prompt para o modelo
    const prompt = `Gere um texto profissional de notificação e solicitação de takedown seguindo a estrutura abaixo.
O texto deve ser cordial e direto, mantendo um tom profissional.

Formato esperado:
Para: [email de abuso]
Assunto: Notificação de Phishing e Solicitação de Takedown - [domínio]

Prezados,

[INTRODUÇÃO: Apresentação cordial e profissional]

[NOTIFICAÇÃO: Informar sobre a identificação do site malicioso, mencionando que é um phishing direcionado à marca ${detectedBrand?.name || 'identificada'}. 
Incluir URL (${domain}) e IP (${ip})]

[EVIDÊNCIAS: Liste os indicadores de phishing detectados:
${phishing_indicators?.join('\n') || 'Atividades maliciosas detectadas'}
${html_analysis?.loginFields ? '- Formulários de login não autorizados detectados' : ''}
${html_analysis?.brandImages ? '- Uso não autorizado de imagens da marca' : ''}
${html_analysis?.securityIcons ? '- Uso indevido de símbolos de segurança' : ''}]

[SOLICITAÇÃO: Pedir a remoção imediata do conteúdo/site devido ao risco aos consumidores]

[ENCERRAMENTO: Agradecer a atenção e se colocar à disposição]

Atenciosamente,
[Assinatura]

DADOS DISPONÍVEIS:
- Domínio: ${domain}
- IP: ${ip}
- Registrar: ${whois.registrar}
- Marca Afetada: ${detectedBrand?.name || 'N/A'}
- Severidade: ${severity || 'ALTA'}
- Indicadores: ${indicators?.join(', ') || 'Atividades maliciosas detectadas'}
- Email de Abuso: ${whois.registrar_abuse_contact_email}

INSTRUÇÕES ESPECÍFICAS:
1. Mantenha um tom cordial e profissional do início ao fim
2. Enfatize que se trata de um phishing direcionado à marca
3. Liste as evidências técnicas encontradas
4. Destaque o risco aos consumidores
5. Solicite a remoção imediata
6. Use linguagem formal mas acessível`;

    // Gerar o texto usando o modelo
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 500
    });

    const generatedText = completion.choices[0].message.content;

    return NextResponse.json({ text: generatedText });
  } catch (error: any) {
    console.error('Erro ao gerar texto:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar texto de takedown' },
      { status: 500 }
    );
  }
}