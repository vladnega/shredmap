'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BIKE_PARK_FACILITY_OPTIONS } from '@/lib/bike-parks/facilities';
import { TRAIL_DIFFICULTY_LABELS, TRAIL_DIFFICULTY_LEVELS } from '@/lib/bike-parks/trail-difficulties';
import type { BikePark, BikeParkRequest } from '@/lib/db/schema';

type DetailPayload = {
  parkRequest: BikeParkRequest;
  targetPark: BikePark | null;
};
type EditablePatch = Record<string, unknown>;

function fetcher(url: string): Promise<DetailPayload> {
  return fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(String(res.status));
    return res.json() as Promise<DetailPayload>;
  });
}

const OPENING_HOURS_DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toSentenceLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

function toDisplay(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value) && value.length === 0) return '—';
  return JSON.stringify(value);
}

function formatCoordinate(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return toDisplay(value);
  }
  return value.toFixed(6);
}

function formatPayment(value: unknown): string {
  if (value === 'paid') return 'Paid';
  if (value === 'free') return 'Free';
  return toDisplay(value);
}

function formatFacilities(value: unknown): string {
  if (!Array.isArray(value)) return toDisplay(value);
  if (value.length === 0) return '—';

  const labelsBySlug: Map<string, string> = new Map(
    BIKE_PARK_FACILITY_OPTIONS.map((option) => [option.slug, option.label]),
  );
  return value
    .map((entry) => {
      if (typeof entry !== 'string') return null;
      return labelsBySlug.get(entry) ?? toSentenceLabel(entry);
    })
    .filter((entry): entry is string => Boolean(entry))
    .join(', ');
}

function formatTrailDifficultyCounts(value: unknown): string {
  if (!isRecord(value)) return toDisplay(value);
  const parts = TRAIL_DIFFICULTY_LEVELS.map((level) => {
    const count = value[level];
    if (typeof count !== 'number') return null;
    return `${TRAIL_DIFFICULTY_LABELS[level]}: ${count}`;
  }).filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' | ') : '—';
}

function formatOpeningHours(value: unknown): string {
  if (!isRecord(value)) return toDisplay(value);
  const parts = OPENING_HOURS_DAYS.map((day) => {
    const dayValue = value[day.key];
    if (typeof dayValue !== 'string' || dayValue.trim().length === 0) return null;
    return `${day.label}: ${dayValue.trim()}`;
  }).filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' | ') : '—';
}

function formatFieldValue(key: string, value: unknown): string {
  if (key === 'latitude' || key === 'longitude') return formatCoordinate(value);
  if (key === 'payment') return formatPayment(value);
  if (key === 'facilities') return formatFacilities(value);
  if (key === 'openingHours') return formatOpeningHours(value);
  if (key === 'trailDifficultyCounts') return formatTrailDifficultyCounts(value);
  return toDisplay(value);
}

function valuesDiffer(key: string, prevValue: unknown, nextValue: unknown): boolean {
  if (key === 'facilities') {
    const prev = Array.isArray(prevValue)
      ? [...prevValue].filter((entry): entry is string => typeof entry === 'string').sort()
      : [];
    const next = Array.isArray(nextValue)
      ? [...nextValue].filter((entry): entry is string => typeof entry === 'string').sort()
      : [];
    return JSON.stringify(prev) !== JSON.stringify(next);
  }
  if (key === 'openingHours' || key === 'trailDifficultyCounts') {
    const prev = isRecord(prevValue) ? prevValue : {};
    const next = isRecord(nextValue) ? nextValue : {};
    return JSON.stringify(prev) !== JSON.stringify(next);
  }
  return formatFieldValue(key, prevValue) !== formatFieldValue(key, nextValue);
}

function fieldLabel(key: string): string {
  const labels: Record<string, string> = {
    name: 'Park name',
    description: 'Description',
    latitude: 'Latitude',
    longitude: 'Longitude',
    website: 'Website',
    buyTicketUrl: 'Buy ticket URL',
    payment: 'Pricing',
    logoUrl: 'Logo URL',
    pinLogoUrl: 'Pin logo URL',
    facilities: 'Facilities',
    openingHours: 'Opening hours',
    trailDifficultyCounts: 'Trail difficulty counts',
  };
  return labels[key] ?? toSentenceLabel(key);
}

export function ParkRequestReview({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<DetailPayload>(
    `/api/admin/park-requests/${requestId}`,
    fetcher,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editablePatch, setEditablePatch] = useState<EditablePatch>({});
  const [showPreviousByKey, setShowPreviousByKey] = useState<Record<string, boolean>>({});

  const parkRequest = data?.parkRequest;
  const proposedPatch = useMemo(() => {
    if (!parkRequest) return null;
    return parkRequest.proposedPatch as Record<string, unknown>;
  }, [parkRequest]);

  useEffect(() => {
    if (proposedPatch) {
      setEditablePatch(proposedPatch);
    }
  }, [proposedPatch]);

  const diffRows = useMemo(() => {
    if (!proposedPatch) return [];
    return Object.keys(proposedPatch).map((key) => {
      const nextValue = editablePatch[key];
      const prevValue =
        parkRequest?.requestType === 'amendment' && data?.targetPark
          ? Reflect.get(data.targetPark as object, key)
          : null;
      const hasPreviousValue = prevValue !== null && prevValue !== undefined;
      const hasDifference = valuesDiffer(key, prevValue, nextValue);
      return {
        key,
        label: fieldLabel(key),
        prevRawValue: prevValue,
        prevValue: formatFieldValue(key, prevValue),
        nextValue: formatFieldValue(key, nextValue),
        hasPreviousValue,
        hasDifference,
        isNewValue: !hasPreviousValue,
      };
    });
  }, [data?.targetPark, editablePatch, parkRequest?.requestType, proposedPatch]);

  function updatePatchField(key: string, value: unknown) {
    setEditablePatch((prev) => ({ ...prev, [key]: value }));
  }

  function updateNestedField(key: string, nestedKey: string, nestedValue: unknown) {
    setEditablePatch((prev) => {
      const source = prev[key];
      const nested = isRecord(source) ? source : {};
      return {
        ...prev,
        [key]: { ...nested, [nestedKey]: nestedValue },
      };
    });
  }

  function toggleFacility(slug: string, enabled: boolean) {
    setEditablePatch((prev) => {
      const existing = Array.isArray(prev.facilities) ? prev.facilities : [];
      const slugs = new Set(existing.filter((entry): entry is string => typeof entry === 'string'));
      if (enabled) {
        slugs.add(slug);
      } else {
        slugs.delete(slug);
      }
      return { ...prev, facilities: Array.from(slugs) };
    });
  }

  function buildPatchForSave(input: EditablePatch): EditablePatch {
    const next: EditablePatch = {};
    for (const [key, value] of Object.entries(input)) {
      if (
        key === 'name' ||
        key === 'description' ||
        key === 'website' ||
        key === 'buyTicketUrl' ||
        key === 'logoUrl' ||
        key === 'pinLogoUrl'
      ) {
        next[key] = typeof value === 'string' ? value.trim() : value;
        continue;
      }
      if (key === 'latitude' || key === 'longitude') {
        const n = typeof value === 'number' ? value : Number(value);
        if (Number.isFinite(n)) next[key] = n;
        continue;
      }
      if (key === 'payment') {
        next[key] = value === 'paid' ? 'paid' : 'free';
        continue;
      }
      if (key === 'facilities') {
        if (Array.isArray(value)) {
          next[key] = value.filter((entry): entry is string => typeof entry === 'string');
        }
        continue;
      }
      if (key === 'openingHours') {
        if (isRecord(value)) {
          const normalized: Record<string, string> = {};
          for (const day of OPENING_HOURS_DAYS) {
            const dayValue = value[day.key];
            if (typeof dayValue === 'string' && dayValue.trim().length > 0) {
              normalized[day.key] = dayValue.trim();
            }
          }
          next[key] = normalized;
        }
        continue;
      }
      if (key === 'trailDifficultyCounts') {
        if (isRecord(value)) {
          const normalized: Record<string, number> = {};
          for (const level of TRAIL_DIFFICULTY_LEVELS) {
            const count = value[level];
            const parsed = typeof count === 'number' ? count : Number(count);
            if (Number.isFinite(parsed)) {
              normalized[level] = Math.max(0, Math.trunc(parsed));
            }
          }
          next[key] = normalized;
        }
        continue;
      }
      next[key] = value;
    }
    return next;
  }

  function renderEditor(key: string) {
    const value = editablePatch[key];
    if (key === 'description') {
      return (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => updatePatchField(key, e.target.value)}
          rows={4}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        />
      );
    }
    if (key === 'payment') {
      return (
        <select
          value={value === 'paid' ? 'paid' : 'free'}
          onChange={(e) => updatePatchField(key, e.target.value)}
          className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
        >
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
      );
    }
    if (key === 'latitude' || key === 'longitude') {
      return (
        <Input
          type="number"
          step="any"
          value={typeof value === 'number' ? value : Number(value) || 0}
          onChange={(e) => updatePatchField(key, Number(e.target.value))}
          className="border-zinc-700 bg-zinc-900 text-zinc-100"
        />
      );
    }
    if (key === 'facilities') {
      const selected = new Set(
        Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [],
      );
      return (
        <div className="flex flex-wrap gap-2">
          {BIKE_PARK_FACILITY_OPTIONS.map((facility) => {
            const active = selected.has(facility.slug);
            return (
              <button
                key={facility.slug}
                type="button"
                onClick={() => toggleFacility(facility.slug, !active)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-orange-500/40 bg-orange-500/20 text-orange-100'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                {facility.label}
              </button>
            );
          })}
        </div>
      );
    }
    if (key === 'openingHours') {
      const valueRecord = isRecord(value) ? value : {};
      return (
        <div className="grid gap-2">
          {OPENING_HOURS_DAYS.map((day) => {
            const dayValue = valueRecord[day.key];
            return (
              <div key={day.key} className="grid gap-2 sm:grid-cols-[100px_1fr] sm:items-center">
                <Label className="text-xs text-zinc-400">{day.label}</Label>
                <Input
                  value={typeof dayValue === 'string' ? dayValue : ''}
                  onChange={(e) => updateNestedField(key, day.key, e.target.value)}
                  placeholder="e.g. 09:00-17:00"
                  className="border-zinc-700 bg-zinc-900 text-zinc-100"
                />
              </div>
            );
          })}
        </div>
      );
    }
    if (key === 'trailDifficultyCounts') {
      const valueRecord = isRecord(value) ? value : {};
      return (
        <div className="grid gap-2">
          {TRAIL_DIFFICULTY_LEVELS.map((level) => {
            const raw = valueRecord[level];
            return (
              <div key={level} className="grid gap-2 sm:grid-cols-[1fr_120px] sm:items-center">
                <Label className="text-xs text-zinc-300">{TRAIL_DIFFICULTY_LABELS[level]}</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={typeof raw === 'number' ? raw : Number(raw) || 0}
                  onChange={(e) => updateNestedField(key, level, Number(e.target.value))}
                  className="border-zinc-700 bg-zinc-900 text-zinc-100"
                />
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <Input
        value={typeof value === 'string' ? value : toDisplay(value)}
        onChange={(e) => updatePatchField(key, e.target.value)}
        className="border-zinc-700 bg-zinc-900 text-zinc-100"
      />
    );
  }

  async function savePatchEdits() {
    if (!parkRequest || parkRequest.status !== 'pending') return;
    setBusy(true);
    setMessage(null);
    try {
      const normalizedPatch = buildPatchForSave(editablePatch);
      const res = await fetch(`/api/admin/park-requests/${parkRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposedPatch: normalizedPatch }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(
          typeof err === 'object' && err && 'error' in err
            ? String((err as { error: string }).error)
            : `Could not update proposal (${res.status})`,
        );
        return;
      }
      setMessage('Proposal updated.');
      await mutate();
      return true;
    } catch {
      setMessage('Could not save proposed changes.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function resolve(action: 'approve' | 'reject') {
    if (!parkRequest || parkRequest.status !== 'pending') return;
    if (action === 'approve') {
      const saved = await savePatchEdits();
      if (!saved) return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/park-requests/${parkRequest.id}/${action}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(
          typeof err === 'object' && err && 'error' in err
            ? String((err as { error: string }).error)
            : `Could not ${action} request (${res.status})`,
        );
        return;
      }
      setMessage(`Park Request ${action}d.`);
      await mutate();
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <p className="text-sm text-zinc-400">Loading request…</p>;
  if (error || !parkRequest) return <p className="text-sm text-red-300">Park Request not found.</p>;

  const requestTypeLabel =
    parkRequest.requestType === 'new_park' ? 'New park proposal' : 'Park amendment';

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-3 px-1">
        <p className="text-sm text-zinc-400">{requestTypeLabel}</p>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            parkRequest.status === 'pending'
              ? 'bg-amber-500/20 text-amber-200'
              : parkRequest.status === 'approved'
                ? 'bg-emerald-500/20 text-emerald-200'
                : 'bg-red-500/20 text-red-200'
          }`}
        >
          {parkRequest.status}
        </span>
      </section>

      <div className="space-y-2">
        {diffRows.map((row) => {
          const canShowPreviousButton = row.hasDifference && row.hasPreviousValue;
          const showPrevious = showPreviousByKey[row.key] === true;
          return (
            <div key={row.key} className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {row.isNewValue ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                  ) : row.hasDifference ? (
                    <span className="h-2 w-2 rounded-full bg-orange-400" aria-hidden />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-transparent" aria-hidden />
                  )}
                  <p className="text-xs font-semibold text-zinc-200">{row.label}</p>
                </div>
                {canShowPreviousButton ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
                    onClick={() =>
                      setShowPreviousByKey((prev) => ({ ...prev, [row.key]: !showPrevious }))
                    }
                  >
                    {showPrevious ? 'Hide previous' : 'Show previous'}
                  </button>
                ) : null}
              </div>
              {parkRequest.status === 'pending' ? (
                renderEditor(row.key)
              ) : (
                <p className="text-sm text-emerald-300 whitespace-pre-wrap break-words">{row.nextValue}</p>
              )}
              {showPrevious ? (
                <p className="mt-2 rounded border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-xs text-zinc-400 whitespace-pre-wrap break-words">
                  Previous: {formatFieldValue(row.key, row.prevRawValue)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {parkRequest.status === 'pending' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              disabled={busy}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={() => void resolve('approve')}
            >
              Approve
            </Button>
            <Button
              type="button"
              disabled={busy}
              variant="destructive"
              className="w-full"
              onClick={() => void resolve('reject')}
            >
              Reject
            </Button>
          </div>
          {message ? <p className="text-xs text-zinc-300">{message}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">This Park Request is already resolved.</p>
      )}
    </div>
  );
}
