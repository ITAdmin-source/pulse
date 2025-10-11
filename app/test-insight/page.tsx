"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Test page for OpenAI insight generation
 * Access at: /test-insight
 */
export default function TestInsightPage() {
  const [testing, setTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    data?: {
      response: string;
      model: string;
      latency: number;
      tokensUsed: {
        prompt_tokens: number;
        completion_tokens: number;
      };
      timestamp: string;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function testConnection() {
    setTesting(true);
    setError(null);
    setConnectionResult(null);

    try {
      const response = await fetch("/api/test/openai-connection");
      const data = await response.json();

      if (data.success) {
        setConnectionResult(data);
      } else {
        setError(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>OpenAI GPT-5 Mini Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={testConnection} disabled={testing} size="lg">
              {testing ? "Testing..." : "Test OpenAI Connection"}
            </Button>
          </div>

          {error && (
            <Card className="border-red-500 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-red-900 whitespace-pre-wrap overflow-auto">
                  {error}
                </pre>
              </CardContent>
            </Card>
          )}

          {connectionResult && (
            <Card className="border-green-500 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Success! ✓</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Model Response:</h3>
                  <p className="text-green-800 bg-white p-3 rounded border border-green-200">
                    {connectionResult.data?.response}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-green-900">Model:</p>
                    <p className="text-green-800">{connectionResult.data?.model}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-green-900">Latency:</p>
                    <p className="text-green-800">{connectionResult.data?.latency}ms</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-green-900">Tokens Used:</p>
                    <p className="text-green-800">
                      Input: {connectionResult.data?.tokensUsed?.prompt_tokens} | Output:{" "}
                      {connectionResult.data?.tokensUsed?.completion_tokens}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-green-900">Timestamp:</p>
                    <p className="text-green-800 text-sm">
                      {connectionResult.data?.timestamp
                        ? new Date(connectionResult.data.timestamp).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>Step 1:</strong> Click the &quot;Test OpenAI Connection&quot; button above
              </p>
              <p>
                <strong>Step 2:</strong> Check the response and console logs
              </p>
              <p>
                <strong>Step 3:</strong> If successful, try generating a real insight by voting on a
                poll
              </p>
              <p className="pt-2 border-t border-blue-300">
                <strong>Check dev server console for detailed logs</strong> - Look for lines starting
                with <code className="bg-blue-100 px-1 rounded">[OpenAI Test]</code>
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
