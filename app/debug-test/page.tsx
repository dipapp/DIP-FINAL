'use client';
import { useState } from 'react';

export default function DebugTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createTestApplicant = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-applicants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: 'pac',
          requestId: 'test-request-123',
          customerName: 'A Y',
          customerPhone: '6197152064',
          customerEmail: 'mlasince2013@gmail.com',
          vehicleInfo: '2024 Acura TLX',
          issueDescription: 'Test service request',
          location: 'Test Location'
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkApplicants = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-applicants');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Test Page</h1>
        
        <div className="space-y-4">
          <button
            onClick={createTestApplicant}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Test Applicant for "pac"'}
          </button>

          <button
            onClick={checkApplicants}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check All Applicants'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-white rounded border">
            <h3 className="font-bold mb-2">Result:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
