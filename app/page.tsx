'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { QuickStat } from '@/components/QuickStat';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertOctagon, Activity, Target, AlertCircle } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const analyzeDomain = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!analysis?.takedown_text) return;
    navigator.clipboard.writeText(analysis.takedown_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
      <div className="fixed inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative p-4 max-w-7xl mx-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Takedown Research
            </h1>
            <p className="text-gray-400 mt-1">
              Análise profissional de domínios suspeitos
            </p>
          </div>

          {/* URL Input e Botão */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Digite a URL suspeita..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg bg-slate-800/80 p-2 text-white placeholder-gray-400 border border-slate-700/50"
              />
            </div>
            <button
              onClick={analyzeDomain}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-emerald-500 font-medium text-white hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analisando...' : 'Analisar →'}
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="text-xs text-gray-400">IP</span>
              </div>
              <p className="text-sm">{analysis?.ip || 'N/A'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-xs text-gray-400">Registrar</span>
              </div>
              <p className="text-sm">{analysis?.whois_info?.registrar || 'N/A'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs text-gray-400">ASN</span>
              </div>
              <p className="text-sm">{analysis?.ip_info?.asn?.asn || 'N/A'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className="text-xs text-gray-400">País</span>
              </div>
              <p className="text-sm">{analysis?.ip_info?.asn?.country || 'N/A'}</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            {/* Two Column Grid for Info and Takedown */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-slate-800/50 border border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <CardTitle>Informações Detalhadas</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {analysis ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-400">Data de Criação</p>
                          <p className="text-sm">{analysis.whois_info?.creation_date || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-400">Data de Expiração</p>
                          <p className="text-sm">{analysis.whois_info?.expiration_date || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-400">Organização</p>
                          <p className="text-sm">{analysis.ip_info?.asn?.org || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-400">Rota</p>
                          <p className="text-sm">{analysis.ip_info?.asn?.route || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-emerald-500 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Registros DNS
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-400">Registros A</p>
                            <p className="text-sm">{analysis.dns_records?.A?.join(', ') || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Nameservers</p>
                            <p className="text-sm">{analysis.dns_records?.NS?.join(', ') || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-emerald-500 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Contatos de Abuso
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-400">Email do Registrar</p>
                            <p className="text-sm">{analysis.whois_info?.registrar_abuse_contact_email || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Email do Hosting</p>
                            <p className="text-sm">{analysis.ip_info?.abuse_contact || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Faça uma análise para ver os resultados</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <CardTitle>Pedido de Takedown</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <textarea
                        value={analysis?.takedown_text || ''}
                        readOnly
                        placeholder="O texto de takedown será gerado automaticamente após a análise..."
                        className="w-full min-h-[500px] bg-transparent text-sm resize-none focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      {analysis?.takedown_text && (
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm hover:bg-emerald-500/20 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          {copied ? 'Copiado!' : 'Copiar'}
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Card Below */}
            {analysis && (
              <Card className="bg-slate-800/50 border border-slate-700/50">
                <CardHeader className="border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${analysis.risk_score > 0.7 ? 'bg-red-500/10' : analysis.risk_score > 0.4 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                        <AlertTriangle className={`h-6 w-6 ${analysis.risk_score > 0.7 ? 'text-red-500' : analysis.risk_score > 0.4 ? 'text-yellow-500' : 'text-green-500'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-white">Análise de Ameaça</CardTitle>
                        <p className="text-sm text-gray-400">
                          Última atualização: {new Date().toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={analysis.risk_score > 0.7 ? 'destructive' : analysis.risk_score > 0.4 ? 'warning' : 'success'} className="bg-opacity-10">
                        {analysis.risk_score > 0.7 ? 'Alto Risco' : analysis.risk_score > 0.4 ? 'Médio Risco' : 'Baixo Risco'}
                      </Badge>
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-500">Ameaça Ativa</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-medium text-white">Alvo</h3>
                      </div>
                      <p className="text-sm text-gray-300">{analysis.detected_brand?.name}</p>
                      <Badge variant="secondary" className="mt-2 bg-slate-700/50">{analysis.brand_category}</Badge>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertOctagon className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-medium text-white">Indicadores</h3>
                      </div>
                      <p className="text-sm text-gray-300">{analysis.phishing_indicators?.length} detectados</p>
                      <Badge variant="secondary" className="mt-2 bg-slate-700/50">Phishing</Badge>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <Activity className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-medium text-white">Impacto</h3>
                      </div>
                      <p className="text-sm text-gray-300">Severidade {Math.round(analysis.risk_score * 100)}%</p>
                      <Badge variant="secondary" className="mt-2 bg-slate-700/50">{analysis.ip_info?.asn?.country?.toUpperCase()}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-emerald-500" />
                        Status da Ameaça
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800/70 transition-all hover:scale-[1.02] duration-300">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Status Atual
                            </p>
                            <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 animate-pulse">Site Online</Badge>
                          </div>
                          <div className="mt-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Tempo Online</span>
                              <span className="text-xs text-emerald-500">
                                {analysis.whois_info?.creation_date ? (
                                  (() => {
                                    const days = Math.round((new Date().getTime() - new Date(analysis.whois_info.creation_date).getTime()) / (1000 * 60 * 60 * 24));
                                    if (days === 0) return "Criado hoje";
                                    if (days < 7) return "Criado esta semana";
                                    return `${days} dias`;
                                  })()
                                ) : "Data desconhecida"}
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500/50 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800/70 transition-all hover:scale-[1.02] duration-300">
                          <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            Resumo do Impacto
                          </p>
                          <div className="space-y-3">
                            <Badge 
                              variant={analysis.risk_score > 0.7 ? 'destructive' : analysis.risk_score > 0.4 ? 'warning' : 'success'} 
                              className={`bg-opacity-10 ${analysis.risk_score > 0.7 ? 'animate-pulse' : ''}`}
                            >
                              {analysis.risk_score > 0.7 
                                ? 'Impacto Crítico - Ameaça ativa e perigosa' 
                                : analysis.risk_score > 0.4 
                                ? 'Impacto Moderado - Ameaça estabelecida' 
                                : 'Impacto Baixo - Ameaça em estágio inicial'}
                            </Badge>
                            <div className="space-y-2 mt-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Nível de Risco</span>
                                <span className={`${analysis.risk_score > 0.7 ? 'text-red-400' : analysis.risk_score > 0.4 ? 'text-yellow-400' : 'text-green-400'}`}>
                                  {Math.round(analysis.risk_score * 100)}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    analysis.risk_score > 0.7 
                                      ? 'bg-red-500/50' 
                                      : analysis.risk_score > 0.4 
                                      ? 'bg-yellow-500/50' 
                                      : 'bg-green-500/50'
                                  }`}
                                  style={{ width: `${Math.round(analysis.risk_score * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800/70 transition-all hover:scale-[1.02] duration-300">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-emerald-500" />
                            <p className="text-sm text-gray-400">Alvo</p>
                          </div>
                          <p className="text-sm text-gray-300 font-medium">{analysis.detected_brand?.name}</p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800/70 transition-all hover:scale-[1.02] duration-300">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-sm text-gray-400">Setor</p>
                          </div>
                          <p className="text-sm text-gray-300 font-medium">
                            {analysis.brand_category === 'Airlines' ? 'Companhia Aérea' : analysis.brand_category}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800/70 transition-all hover:scale-[1.02] duration-300">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                            <p className="text-sm text-gray-400">Região</p>
                          </div>
                          <p className="text-sm text-gray-300 font-medium">{analysis.ip_info?.asn?.country?.toUpperCase() || 'Desconhecida'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                        <AlertOctagon className="h-5 w-5 text-emerald-500" />
                        Indicadores de Ameaça
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {analysis.phishing_indicators?.map((indicator: string, index: number) => (
                          <div key={index} className="flex items-start space-x-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800/70 transition-all hover:scale-[1.02] duration-300">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            <span className="text-sm text-gray-300">{indicator}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-500" />
                        Impacto e Mitigação
                      </h3>
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 hover:bg-slate-800/70 transition-all hover:scale-[1.02] duration-300">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-emerald-500" />
                              Potencial de Dano
                            </p>
                            <p className="text-sm text-gray-300">
                              {analysis.risk_score > 0.7 
                                ? 'Crítico - Roubo de dados sensíveis' 
                                : analysis.risk_score > 0.4 
                                ? 'Moderado - Coleta de credenciais' 
                                : 'Baixo - Tentativa de phishing'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Recomendação
                            </p>
                            <p className="text-sm text-gray-300">Takedown imediato e notificação aos usuários</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Status de Contenção
                            </p>
                            <p className="text-sm text-gray-300">Aguardando ação do provedor</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
}

