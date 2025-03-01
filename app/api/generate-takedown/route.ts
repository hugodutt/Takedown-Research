import { NextResponse } from 'next/server';
import { TakedownRequest } from '@/app/types/domain';

export async function POST(request: Request) {
  try {
    const { url, whois_info } = await request.json() as TakedownRequest;
    
    const takedownText = `Dear Abuse Team,

I am writing to report a phishing website that is impersonating our brand and potentially harming users:

URL: ${url}

This domain was registered through your services and is being used for malicious purposes. We kindly request the immediate suspension of this domain to protect users from potential fraud.

Registration Information:
Registrar: ${whois_info.registrar || 'N/A'}
Creation Date: ${whois_info.creation_date || 'N/A'}
Expiration Date: ${whois_info.expiration_date || 'N/A'}

Please take immediate action to suspend this domain. If you require any additional information, please don't hesitate to contact us.

Best regards,
Brand Protection Team`;

    return NextResponse.json({ takedown_text: takedownText });
  } catch (error: unknown) {
    console.error('Erro ao gerar texto:', error);
    return NextResponse.json({ error: 'Erro ao gerar texto de takedown' }, { status: 500 });
  }
}