import { handleAuth } from '@workos-inc/authkit-nextjs';
import { syncWorkOsUserToDatabase } from '@/lib/auth/sync-workos-user';

export const GET = handleAuth({
  returnPathname: '/',
  onSuccess: async ({ user }) => {
    await syncWorkOsUserToDatabase({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  },
});
