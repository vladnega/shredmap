'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReply('');
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: input }],
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          typeof data?.error === 'string'
            ? data.error
            : `Request failed (${res.status})`
        );
        return;
      }
      if (typeof data?.text === 'string') {
        setReply(data.text);
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 w-full">
      <Card>
        <CardHeader>
          <CardTitle>AI chat</CardTitle>
          <p className="text-sm text-muted-foreground">
            Requires <code className="text-xs">OPENAI_API_KEY</code>. Uses the
            Vercel AI SDK with a single completion—swap to streaming when you
            need it.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}
          <div className="min-h-[120px] rounded-md border border-gray-200 bg-white p-4 text-sm whitespace-pre-wrap">
            {reply || (
              <span className="text-muted-foreground">
                Response will appear here.
              </span>
            )}
          </div>
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something…"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? '…' : 'Send'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
