import { z } from 'zod';
import { OrganizationWithMembers, User } from '@/lib/db/schema';
import { getOrganizationForUser, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: unknown;
};

type ValidatedActionFunction<S extends z.ZodTypeAny, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodTypeAny, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.issues[0]?.message ?? 'Invalid input' };
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodTypeAny, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodTypeAny, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.issues[0]?.message ?? 'Invalid input' };
    }

    return action(result.data, formData, user);
  };
}

type ActionWithOrganizationFunction<T> = (
  formData: FormData,
  organization: OrganizationWithMembers
) => Promise<T>;

export function withOrganization<T>(action: ActionWithOrganizationFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }

    const organization = await getOrganizationForUser();
    if (!organization) {
      throw new Error('Organization not found');
    }

    return action(formData, organization);
  };
}
