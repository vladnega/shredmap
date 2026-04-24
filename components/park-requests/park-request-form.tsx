'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BikeParkReadOnlyBody } from '@/components/bike-parks/bike-park-read-only-body';
import { BikeParkFields } from '@/components/bike-parks/fields/bike-park-fields';
import { ParkRequestListingPreview } from '@/components/park-requests/park-request-listing-preview';
import { ParkReviewSummaryHeader } from '@/components/reviews/park-review-summary-header';
import { Button } from '@/components/ui/button';
import type { BikePark } from '@/lib/db/schema';
import {
  buildAmendmentProposedPatchFromForm,
  buildNewParkProposedPayloadFromForm,
} from '@/lib/bike-parks/park-form-normalization';
import {
  bikeParkToFormFields,
  emptyBikeParkFormFields,
  type BikeParkFormFieldsState,
} from '@/lib/bike-parks/park-form-state';

type ParkRequestFormProps =
  | { mode: 'amendment'; targetPark: BikePark; googleMapsApiKey: string }
  | { mode: 'new_park'; googleMapsApiKey: string };

export function ParkRequestForm(props: ParkRequestFormProps) {
  const router = useRouter();
  const initialFields = useMemo<BikeParkFormFieldsState>(() => {
    if (props.mode === 'new_park') {
      return emptyBikeParkFormFields();
    }
    return bikeParkToFormFields(props.targetPark);
  }, [props]);

  const [fields, setFields] = useState<BikeParkFormFieldsState>(initialFields);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      let body: unknown;
      if (props.mode === 'new_park') {
        body = {
          requestType: 'new_park',
          proposedPatch: buildNewParkProposedPayloadFromForm(fields),
        };
      } else {
        const proposedPatch = buildAmendmentProposedPatchFromForm(fields, initialFields);
        if (!proposedPatch) {
          setMessage('No changes detected yet.');
          setBusy(false);
          return;
        }
        body = {
          requestType: 'amendment',
          targetParkId: props.targetPark.id,
          proposedPatch,
        };
      }

      const res = await fetch('/api/park-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(
          typeof err === 'object' && err && 'error' in err
            ? String((err as { error: string }).error)
            : `Request failed (${res.status})`,
        );
        setBusy(false);
        return;
      }

      setMessage('Park Request submitted.');
      router.push('/');
    } catch {
      setMessage('Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
      <aside className="w-full lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-xl backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {props.mode === 'amendment' ? 'Current Shredmap listing' : 'Listing preview'}
          </p>
          {props.mode === 'amendment' ? (
            <>
              <h2 className="mt-2 text-lg font-bold tracking-tight text-white">
                {props.targetPark.name}
              </h2>
              <ParkReviewSummaryHeader bikeParkId={props.targetPark.id} />
              <BikeParkReadOnlyBody park={props.targetPark} showStaticLocationMap />
            </>
          ) : (
            <ParkRequestListingPreview
              name={fields.name}
              descriptionPlain={fields.description}
              latitude={fields.latitude}
              longitude={fields.longitude}
              logoUrl={fields.logoUrl}
              website={fields.website}
              buyTicketUrl={fields.buyTicketUrl}
              requiresPayment={fields.requiresPayment}
              openingHours={fields.openingHours}
              trailDifficultyCounts={fields.trailDifficultyCounts}
              facilitySlugs={fields.facilities}
            />
          )}
        </div>
      </aside>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="w-full min-w-0 max-w-2xl space-y-6 lg:max-w-none"
      >
        {message ? <p className="text-sm text-zinc-300">{message}</p> : null}

        <BikeParkFields
          idPrefix="pr"
          value={fields}
          onChange={setFields}
          googleMapsApiKey={props.googleMapsApiKey}
          showLocationPicker
          showTrailDifficultyPills
          urlInputsAsUrl={false}
          disabled={busy}
        />

        <Button
          type="submit"
          disabled={busy}
          className="bg-orange-600 text-white hover:bg-orange-500"
        >
          {busy ? 'Submitting…' : 'Submit Park Request'}
        </Button>
      </form>
    </div>
  );
}
