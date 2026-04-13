'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { updateAccount } from '@/app/(auth)/actions';
import type { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
};

type WorkOsRoles = {
  roles: string[];
  permissions: string[];
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = '',
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Your name"
          defaultValue={state.name || nameValue}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Your email"
          defaultValue={emailValue}
          required
        />
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  return (
    <AccountForm
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
    />
  );
}

export default function AccountPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );
  const { data: workOsRoles } = useSWR<WorkOsRoles>('/api/workos/roles', fetcher);
  const roles = workOsRoles?.roles ?? [];

  return (
    <section className="mx-auto w-full max-w-3xl">
      <h1 className="text-2xl font-semibold text-white">Account</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Manage your profile details and view your current WorkOS role assignments.
      </p>

      <Card className="mt-8 border-zinc-800 bg-zinc-900/70 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-base text-zinc-100">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={formAction}>
            <Suspense fallback={<AccountForm state={state} />}>
              <AccountFormWithData state={state} />
            </Suspense>
            {state.error ? (
              <p className="text-sm text-red-400">{state.error}</p>
            ) : null}
            {state.success ? (
              <p className="text-sm text-emerald-400">{state.success}</p>
            ) : null}
            <Button
              type="submit"
              className="bg-orange-500 text-white hover:bg-orange-600"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4 border-zinc-800 bg-zinc-900/70 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-base text-zinc-100">WorkOS Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No roles are currently assigned in your active WorkOS session.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <li
                  key={role}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-100"
                >
                  {role}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
