/**
 * Shredmap — create or update bike parks (browser console)
 *
 * How to run:
 * 1. Open your deployed Shredmap site (or localhost) and sign in as a user with bike-park staff role.
 * 2. Open DevTools → Console.
 * 3. Paste this entire file and press Enter.
 *
 * Behaviour: loads /api/bike-parks, matches each row by `matchName`. If found → PATCH; if not → POST then PATCH when `payment` is set (POST does not accept payment).
 *
 * Research snapshot: 2026-04. Adjust payloads before running if sources change.
 *
 * trailDifficultyCounts — estimates for parks without operator “per band” tables:
 * - Woburn: inferred from iBikeRide / rebuild reporting (green learner line, Flowburn blue, black DH, dual slalom, dirt
 *   jumps, orange/pro tiers → double black). Bike park closed for rebuild; illustrative of intended layout, not XC trails.
 * - Aston Hill: historic venue (pre-2021 closure) — worldbikeparks.com listed 7 trails (2 moderate / 5 difficult);
 *   mapped moderate→blue, difficult split red/black from typical Aston DH labelling (Wikipedia / rideastonhill).
 * - Epping: Trailforks region difficulty histogram for mapped MTB segments (~227 trails); not City of London official grades.
 */

(async () => {
  const json = async (url, init = {}) => {
    const r = await fetch(url, {
      credentials: 'include',
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
    let body = null;
    try {
      body = await r.json();
    } catch {
      /* ignore */
    }
    return { ok: r.ok, status: r.status, body };
  };

  const listRes = await json('/api/bike-parks');
  if (!listRes.ok || !listRes.body?.parks) {
    console.error('Could not load /api/bike-parks', listRes);
    return listRes;
  }

  const byName = new Map(listRes.body.parks.map((p) => [p.name, p]));

  /** @type {Array<{ matchName: string, create: object, payment?: 'paid' | 'free' }>} */
  const parks = [
    {
      matchName: 'Chicksands Bike Park',
      payment: 'paid',
      create: {
        name: 'Chicksands Bike Park',
        description:
          'All-weather bike park in the Forest of Rowney Warren, Bedfordshire with 31 trails from green pump tracks through orange-graded jump lines, bike hire, on-site coaching and cafe snacks. Trail counts below are derived from the operator’s trail guide (31 total); orange-style lines are mapped to double black.',
        latitude: 52.061507,
        longitude: -0.373963,
        website: 'https://chicksandsbikepark.co.uk/',
        buyTicketUrl: 'https://chicksandsbikepark.co.uk/collections/memberships',
        logoUrl:
          'https://chicksandsbikepark.co.uk/cdn/shop/files/Organic_Farm_Logo_Template_with_Abstract_Shapes_Sun_and_Tree_100_x_100cm.png?v=1745749258&width=300',
        pinLogoUrl:
          'https://chicksandsbikepark.co.uk/cdn/shop/files/Organic_Farm_Logo_Template_with_Abstract_Shapes_Sun_and_Tree_100_x_100cm.png?v=1745749258&width=96',
        facilities: ['bike_rental', 'food_drink', 'coaching', 'toilets'],
        trailDifficultyCounts: {
          green: 2,
          blue: 10,
          red: 12,
          black: 6,
          doubleBlack: 1,
        },
        openingHours: {
          tuesday: '10:00-17:00',
          wednesday: '10:00-17:00',
          thursday: '10:00-17:00',
          friday: '10:00-17:00',
          saturday: '09:00-17:00',
          sunday: '09:00-17:00',
        },
      },
    },
    {
      matchName: 'Woburn Bike Park and Trails',
      payment: 'free',
      create: {
        name: 'Woburn Bike Park and Trails',
        description:
          'Estate-run venue in Aspley Woods near Woburn Sands. The Bedford Estates closed the bike park from 1 December 2025 for forestry work and redevelopment with Matt Jones; reopening was targeting mid–late Spring 2026 (May working target). Wider bike and horse trails may stay open on free temporary permits—check the estate site. Trail counts are a rough split of reported bike-park lines (green/beginner, Flowburn blue, black DH, dual slalom, jump lines, orange/pro tiers) from public rebuild and listing sources while the park is closed—exclude separate Woburn XC loops unless you merge listings.',
        latitude: 52.004573,
        longitude: -0.632777,
        website: 'https://www.woburn.co.uk/the-estate/woburn-bike-park-and-trails/',
        logoUrl: 'https://www.woburn.co.uk/Static/images/fav/apple-touch-icon.png',
        pinLogoUrl: 'https://www.woburn.co.uk/Static/images/fav/favicon-32x32.png',
        facilities: [],
        trailDifficultyCounts: {
          green: 1,
          blue: 2,
          red: 2,
          black: 2,
          doubleBlack: 3,
        },
      },
    },
    {
      matchName: 'Aston Hill Bike Park',
      payment: 'paid',
      create: {
        name: 'Aston Hill Bike Park',
        description:
          'Downhill-focused bike park on Forestry England land near Wendover, operated by Bike Park Chilterns CIC. Closed since ash dieback clearance; rebuild in progress with a planned public reopening (check astonhill.co.uk and forestryengland.uk). Coordinates from Forestry England’s place metadata for the Aston Hill Bike Park page. Historic trail counts reflect the pre-closure network (about seven waymarked features: five DH runs plus 4X and XC segments per third-party trail-centre summaries).',
        latitude: 51.782763,
        longitude: -0.709176,
        website: 'https://www.astonhill.co.uk/',
        buyTicketUrl: 'https://www.gofundme.com/f/rebuild-aston-hill-bike-park-help-us-finish-the-trails',
        logoUrl:
          'https://astonhill.co.uk/wp-content/uploads/2025/05/Aston-Hill-Saracen-Logo-White-01-e1747088827182-300x241.png',
        pinLogoUrl: 'https://astonhill.co.uk/wp-content/uploads/2025/06/cropped-AH-Logo-192x192.png',
        facilities: [],
        trailDifficultyCounts: {
          green: 0,
          blue: 2,
          red: 2,
          black: 3,
          doubleBlack: 0,
        },
      },
    },
    {
      matchName: 'Epping Forest (cycling)',
      payment: 'free',
      create: {
        name: 'Epping Forest (cycling)',
        description:
          'City of London–managed ancient woodland with 284 km of shared-use cycling paths. Follow the City’s permitted cycling map and code of conduct. Trail difficulty counts below are aggregated from Trailforks difficulty ratings on user-mapped MTB segments in the forest (~227 segments)—not an official City “trail centre” grading; many paths are shared bridleways.',
        latitude: 51.656,
        longitude: 0.034,
        website:
          'https://www.cityoflondon.gov.uk/things-to-do/green-spaces/epping-forest/activities-in-epping-forest/cycling-in-epping-forest',
        logoUrl:
          'https://www.cityoflondon.gov.uk/_IHS62Q_9c86aac8-3e6b-4114-9217-960b2be3bae8/static/img/favicon/col_apple_icon.png',
        pinLogoUrl:
          'https://www.cityoflondon.gov.uk/_IHS62Q_9c86aac8-3e6b-4114-9217-960b2be3bae8/static/img/favicon/favicon-32x32.png',
        facilities: [],
        trailDifficultyCounts: {
          green: 40,
          blue: 94,
          red: 88,
          black: 5,
          doubleBlack: 0,
        },
      },
    },
  ];

  const results = [];

  for (const item of parks) {
    const { matchName, create, payment } = item;
    const existing = byName.get(matchName);

    const patchBody = {
      name: create.name,
      description: create.description,
      latitude: create.latitude,
      longitude: create.longitude,
      website: create.website ?? null,
      buyTicketUrl: create.buyTicketUrl ?? null,
      logoUrl: create.logoUrl ?? null,
      pinLogoUrl: create.pinLogoUrl ?? null,
      facilities: create.facilities ?? [],
      trailDifficultyCounts: create.trailDifficultyCounts,
      openingHours: create.openingHours ?? null,
      ...(payment !== undefined ? { payment } : {}),
    };

    if (existing) {
      const out = await json(`/api/bike-parks/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(patchBody),
      });
      results.push({ matchName, op: 'PATCH', ...out });
      console.log(matchName, 'PATCH', out.status, out.body);
      continue;
    }

    const {
      name,
      description,
      latitude,
      longitude,
      website,
      buyTicketUrl,
      logoUrl,
      pinLogoUrl,
      facilities,
      trailDifficultyCounts,
      openingHours,
    } = create;

    const postBody = {
      name,
      description,
      latitude,
      longitude,
      website,
      buyTicketUrl,
      logoUrl,
      pinLogoUrl,
      facilities,
      trailDifficultyCounts,
      openingHours,
    };

    const post = await json('/api/bike-parks', {
      method: 'POST',
      body: JSON.stringify(postBody),
    });
    results.push({ matchName, op: 'POST', ...post });
    console.log(matchName, 'POST', post.status, post.body);

    if (post.status === 201 && post.body?.id && payment !== undefined) {
      const pay = await json(`/api/bike-parks/${post.body.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ payment }),
      });
      results.push({ matchName, op: 'PATCH_payment', ...pay });
      console.log(matchName, 'PATCH payment', pay.status, pay.body);
    }
  }

  console.table(
    results.map((r) => ({
      name: r.matchName,
      op: r.op,
      status: r.status,
      ok: r.ok,
    })),
  );
  return results;
})();
