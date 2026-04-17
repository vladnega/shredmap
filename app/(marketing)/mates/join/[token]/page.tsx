import { MateJoinClient } from './mate-join-client';

export default async function MateJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 32) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-center text-zinc-400">Invalid invite link.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[80dvh] max-w-lg px-4 py-12">
      <MateJoinClient token={token} />
    </div>
  );
}
