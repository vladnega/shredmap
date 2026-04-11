import { db } from './drizzle';
import { users, organizations, organizationMembers, catalogItems } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { seedBikeParksFromJsonFile } from '@/lib/bike-parks/seed-from-json';

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: 'owner',
      },
    ])
    .returning();

  console.log('Initial user created.');

  const [organization] = await db
    .insert(organizations)
    .values({
      name: 'Demo workspace',
    })
    .returning();

  await db.insert(organizationMembers).values({
    organizationId: organization.id,
    userId: user.id,
    role: 'owner',
  });

  await db.insert(catalogItems).values([
    {
      slug: 'example-item',
      title: 'Example listing',
      description:
        'Replace catalog_items with your own tables or extend this one for demos.',
    },
    {
      slug: 'second-item',
      title: 'Another listing',
      description: 'Seed data for list and detail routes.',
    },
  ]);

  console.log('Catalog items seeded.');

  try {
    const n = await seedBikeParksFromJsonFile();
    if (n > 0) {
      console.log(`Bike parks seeded/updated: ${n} rows (data/bike-parks.seed.json).`);
    } else {
      console.log(
        'Bike parks: skipped (add data/bike-parks.seed.json to seed parks).'
      );
    }
  } catch (e) {
    console.warn(
      'Bike park seed failed:',
      e instanceof Error ? e.message : e
    );
  }
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
