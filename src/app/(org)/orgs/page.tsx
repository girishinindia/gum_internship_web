'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Button, Field, Select, Modal, EmptyState, SkeletonCard } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const STATES = ['Gujarat', 'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'];

export default function OrgsPage(): JSX.Element {
  const toast = useToast();
  const [orgs, setOrgs] = useState<Any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', gstin: '', billingState: 'Gujarat', billingEmail: '' });
  const [busy, setBusy] = useState(false);

  const load = async (): Promise<void> => { const { data } = await api<Any[]>('/orgs/mine'); setOrgs(data); };
  useEffect(() => { void load().catch(() => setOrgs([])); }, []);

  const create = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); setBusy(true);
    try {
      await api('/orgs/register', { method: 'POST', body: JSON.stringify({
        name: f.name, gstin: f.gstin || undefined, billingState: f.billingState, billingEmail: f.billingEmail || undefined,
      }) });
      toast('success', 'Organization created.');
      setOpen(false); setF({ name: '', gstin: '', billingState: 'Gujarat', billingEmail: '' });
      void load();
    } catch (err) {
      toast('danger', err instanceof ApiError ? err.message : 'Could not create organization.');
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1">Organizations</h1>
        <Button size="sm" onClick={() => setOpen(true)}>New organization</Button>
      </div>
      <p className="mt-1 text-body-sm text-neutral-600">Buy seats in bulk and assign internships to your team.</p>

      {!orgs ? <div className="mt-6"><SkeletonCard /></div>
      : orgs.length === 0 ? <EmptyState icon="🏢" title="No organizations yet" message="Create one to manage team learning and B2B invoices." />
      : (
        <div className="mt-6 space-y-3">
          {orgs.map((o) => (
            <Link key={o.id} href={`/orgs/${o.id}`} className="card card-hover flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-neutral-800">{o.name}</p>
                <p className="text-caption text-neutral-500">{o.seatsUsed}/{o.seatsTotal} seats used · {o.members} members</p>
              </div>
              <span className="text-neutral-300">›</span>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New organization"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={(e) => create(e as unknown as React.FormEvent)}>Create</Button></>}>
        <form onSubmit={create} className="space-y-3">
          <Field label="Company name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required minLength={2} />
          <Field label="GSTIN (optional)" value={f.gstin} onChange={(e) => setF({ ...f, gstin: e.target.value.toUpperCase() })} maxLength={15} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Billing state" value={f.billingState} onChange={(e) => setF({ ...f, billingState: e.target.value })}>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Field label="Billing email" type="email" value={f.billingEmail} onChange={(e) => setF({ ...f, billingEmail: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
