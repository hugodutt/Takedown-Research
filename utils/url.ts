/**
 * Extrai o domínio de uma URL
 * @param url URL completa ou domínio
 * @returns Domínio limpo
 */
export function extractDomain(url: string): string {
  try {
    // Adiciona http:// se não tiver protocolo
    const urlWithProtocol = url.startsWith('http') ? url : `http://${url}`;
    const urlObj = new URL(urlWithProtocol);
    return urlObj.hostname;
  } catch (error) {
    // Se falhar ao parsear como URL, tenta extrair o domínio diretamente
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}