'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Activity, Target, AlertCircle } from 'lucide-react';
import { DomainAnalysis } from './types/domain';

export default function Home() {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<DomainAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzeDomain = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze domain');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Domain Analysis</CardTitle>
          <CardDescription>Enter a domain to analyze potential threats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="url"
              placeholder="Enter domain URL"
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={analyzeDomain} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {analysis && (
            <div className="mt-6 space-y-6">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">Threat Analysis</CardTitle>
                    <Badge variant={analysis.risk_score > 0.7 ? "destructive" : "secondary"} className="animate-pulse">
                      {analysis.risk_score > 0.7 ? 'Critical Risk' : 'Site Online'}
                      <span className="ml-2 w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">Target:</span>
                      <span>{analysis.url}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">Setor:</span>
                      <span>Companhia Aérea</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">Region:</span>
                      <span>{analysis.ip_info.asn.country}</span>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between mb-2">
                        <span>Risk Level</span>
                        <span>{Math.round(analysis.risk_score * 100)}%</span>
                      </div>
                      <Progress value={analysis.risk_score * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => copyToClipboard(analysis.takedown_text)}
                  >
                    {copied ? 'Copied!' : 'Copy Takedown Request'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

