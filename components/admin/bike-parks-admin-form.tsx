'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BikeParkFields } from '@/components/bike-parks/fields/bike-park-fields';
import { Button } from '@/components/ui/button';
import type { BikePark } from '@/lib/db/schema';
import { buildBikeParkAdminPatchBody } from '@/lib/bike-parks/park-form-normalization';
import {
  bikeParkToFormFields,
  emptyBikeParkFormFields,
  type BikeParkFormFieldsState,
} from '@/lib/bike-parks/park-form-state';

export function BikeParksAdminForm({
  googleMapsApiKey,
  initialParkId,
}: {
  googleMapsApiKey: string;
  initialParkId?: string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | ''>('');
  const [fields, setFields] = useState<BikeParkFormFieldsState>(emptyBikeParkFormFields);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resetToCreate = useCallback(() => {
    setEditingId('');
    setFields(emptyBikeParkFormFields());
    setMessage(null);
  }, []);

  const loadParkForEdit = useCallback(
    async (id: string) => {
      if (!id) {
        resetToCreate();
        return;
      }
      setBusy(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/bike-parks/${id}`);
        if (!res.ok) {
          setMessage(`Could not load park (${res.status})`);
          setBusy(false);
          return;
        }
        const park: BikePark = await res.json();
        setEditingId(park.id);
        setFields(bikeParkToFormFields(park));
      } catch {
        setMessage('Could not load park');
      } finally {
        setBusy(false);
      }
    },
    [resetToCreate],
  );

  useEffect(() => {
    if (!initialParkId) {
      return;
    }
    if (initialParkId === editingId) {
      return;
    }
    void loadParkForEdit(initialParkId);
  }, [editingId, initialParkId, loadParkForEdit]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) {
      setMessage('Pick a bike park from Manage parks first.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const body = buildBikeParkAdminPatchBody(fields);
      const res = await fetch(`/api/bike-parks/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(
          typeof err === 'object' && err && 'error' in err
            ? String((err as { error: string }).error)
            : `Update failed (${res.status})`,
        );
        setBusy(false);
        return;
      }
      setMessage('Park updated.');
    } catch {
      setMessage('Request failed');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!editingId) return;
    if (!window.confirm('Delete this bike park? This cannot be undone.')) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/bike-parks/${editingId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        setMessage(`Delete failed (${res.status})`);
        setBusy(false);
        return;
      }
      setMessage('Park deleted.');
      router.push('/admin/bike-parks');
    } catch {
      setMessage('Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const submitDisabled = busy || !editingId;

  return (
    <div className="space-y-8">
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6 max-w-2xl">
        <BikeParkFields
          idPrefix="bp"
          value={fields}
          onChange={setFields}
          googleMapsApiKey={googleMapsApiKey}
          showLocationPicker
          showTrailDifficultyPills={false}
          urlInputsAsUrl
          disabled={busy}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={submitDisabled}
            className="bg-orange-600 text-white hover:bg-orange-500"
          >
            Save changes
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void onDelete()}
            >
              Delete park
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
