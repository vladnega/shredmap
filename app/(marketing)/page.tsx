import { Button } from '@/components/ui/button';
import { ArrowRight, Layers, Server } from 'lucide-react';
import Link from 'next/link';
import { HeroTerminal } from '@/components/marketing/hero-terminal';

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Ship a full product
                <span className="block text-orange-500">public site + app</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Next.js boilerplate with auth, Postgres, catalog examples, and an
                optional AI hook—ready to specialize into a directory, shop,
                marketplace, or SaaS.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Button asChild size="lg" className="text-lg rounded-full">
                  <Link href="/items">
                    View sample catalog
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg rounded-full">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <HeroTerminal />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Layers className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Clear route groups
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Marketing, catalog, auth, and app areas are separated so you can
                  evolve each surface without tangling concerns.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Server className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Postgres + Drizzle
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Users, organizations, invitations, and a sample catalog table
                  you can extend or replace for your domain.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <ArrowRight className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Optional AI
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Wire your OpenAI key for the chat scaffold, or remove the route
                  until you need it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Start from a neutral base
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                No subscription product is assumed. Add payments, search, or CMS
                integrations where your product needs them.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <Button asChild size="lg" variant="outline" className="text-lg rounded-full">
                <Link href="/contact">
                  Contact pattern
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
