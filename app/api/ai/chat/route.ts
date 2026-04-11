import { generateText } from 'ai';
import { getDefaultChatModel, getOpenAIProvider } from '@/lib/ai/openai';

export const maxDuration = 60;

export async function POST(req: Request) {
  const provider = getOpenAIProvider();
  if (!provider) {
    return Response.json(
      {
        error:
          'OpenAI is not configured. Set OPENAI_API_KEY in your environment.',
      },
      { status: 503 }
    );
  }

  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const messages = body.messages;
  if (!messages?.length) {
    return Response.json({ error: 'messages array is required' }, { status: 400 });
  }

  const result = await generateText({
    model: provider(getDefaultChatModel()),
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  });

  return Response.json({ text: result.text });
}
