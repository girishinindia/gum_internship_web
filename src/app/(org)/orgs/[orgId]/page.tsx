'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { ApiError } from '@/lib/types';
import { Avatar, Badge, Button, Field, Select, Modal, StatCard, Spinner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export default function OrgTeamPage(): JSX.Element {
  const { orgId } = useParams<{ orgId: string }>();
  const oid = Number(orgId);
  const toast = useToast();
  const [team, setTeam] = useState<Any | null>(null);
  const [internships, setInternships] = useState<Any[]>([]);
  const [modal, setModal] = useState<'' | 'seats' | 'member' | 'assign'>('');
  const [busy, setBusy] = useState(false);

  // forms
  const [seats, setSeats] = useState(5); const [unitPrice, setUnitPrice] = useState(1000);
  const [email, setEmail] = useState(''); const [role, setRole] = useState('member');
  const [assignMember, setAssignMember] = useState<number | ''>(''); const [assignInternship, setAssignInternship] = useState<number | ''>('');

  const load = useCallback(async (): Promise<void> => { const { data } = await api<Any>(`/orgs/${oid}/team`); setTeam(data); }, [oid]);
  useEffect(() => { void load().catch(() => setTeam({ error: true })); }, [load]);
  useEffect(() => { void api<Any[]>('/catalog/internships?limit=100').then(({ data }) => setInternships(data)).catch(() => undefined); }, []);

  const act = async (fn: () => Promise<void>, ok: string): Promise<void> => {
    setBusy(true);
    try { await fn(); toast('success', ok); setModal(''); await load(); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  };

  const buySeats = (): Promise<void> => act(async () => { await api(`/orgs/${oid}/seats/purchase`, { method: 'POST', body: JSON.stringify({ seats: Number(seats), unitPrice: Number(unitPrice) }) }); }, 'Seats purchased — invoice generated.');
  const addMember = (): Promise<void> => act(async () => { await api(`/orgs/${oid}/members`, { method: 'POST', body: JSON.stringify({ email, role }) }); }, 'Member added.');
  const assign = (): Promise<void> => act(async () => { await api(`/orgs/${oid}/seats/assign`, { method: 'POST', body: JSON.stringify({ memberUserId: Number(assignMember), internshipId: Number(assignInternship) }) }); }, 'Seat assigned — member enrolled.');

  if (!team) return <div className="flex justify-center p-12"><Spinner /></div>;
  if (team.error) return <p className="card p-8 text-center text-danger-700">Organization not found or you don&apos;t manage it.</p>;

  return (
    <div>
      <Link href="/orgs" className="text-body-sm text-neutral-500 hover:text-neutral-800">‹ Organizations</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1">Team</h1>
        <div className="flex gap-2">
          <Link href={`/orgs/${oid}/branding`} className="btn-outline !h-9 px-3 text-body-sm">🎨 Branding</Link>
          <Button size="sm" variant="outline" onClick={() => setModal('member')}>Add member</Button>
          <Button size="sm" variant="outline" onClick={() => setModal('seats')}>Buy seats</Button>
          <Button size="sm" onClick={() => setModal('assign')} disabled={team.seatsRemaining <= 0}>Assign seat</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard label="Seats total" value={team.seatsTotal} />
        <StatCard label="Used" value={team.seatsUsed} />
        <StatCard label="Remaining" value={team.seatsRemaining} />
      </div>

      <h2 className="mt-8 text-h3">Members</h2>
      <div className="mt-3 space-y-2">
        {(team.members as Any[]).map((m) => (
          <div key={m.userId} className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar name={m.name} size="sm" />
              <div className="flex-1"><span className="font-medium text-neutral-800">{m.name}</span> <span className="text-caption text-neutral-500">{m.email}</span></div>
              <Badge tone={m.role === 'admin' ? 'primary' : 'neutral'} className="capitalize">{m.role}</Badge>
            </div>
            {(m.assignments as Any[])?.length > 0 && (
              <ul className="mt-2 space-y-1 pl-11">
                {(m.assignments as Any[]).map((a) => (
                  <li key={a.internshipId} className="flex items-center justify-between text-body-sm text-neutral-600">
                    <span>{a.title}</span><span className="text-caption">{Math.round(Number(a.progressPercent ?? 0))}% · {a.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {(team.invoices as Any[])?.length > 0 && (
        <>
          <h2 className="mt-8 text-h3">Seat invoices (B2B GST)</h2>
          <div className="mt-3 space-y-2">
            {(team.invoices as Any[]).map((inv) => (
              <div key={inv.id} className="card flex items-center justify-between p-4 text-body-sm">
                <span>{inv.invoiceNo} · {inv.seats} seats @ {inr(Number(inv.unitPrice))}</span>
                <span className="font-medium">{inr(Number(inv.totalAmount))} <span className="text-caption text-neutral-400">(incl. GST {inr(Number(inv.gstAmount))})</span></span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      <Modal open={modal === 'seats'} onClose={() => setModal('')} title="Buy seats"
        footer={<><Button variant="ghost" onClick={() => setModal('')}>Cancel</Button><Button loading={busy} onClick={buySeats}>Purchase</Button></>}>
        <div className="space-y-3">
          <Field label="Number of seats" type="number" value={String(seats)} onChange={(e) => setSeats(Number(e.target.value))} min={1} />
          <Field label="Price per seat (₹)" type="number" value={String(unitPrice)} onChange={(e) => setUnitPrice(Number(e.target.value))} min={0} />
          <p className="text-caption text-neutral-500">A B2B GST invoice is generated; GST split follows your billing state.</p>
        </div>
      </Modal>

      <Modal open={modal === 'member'} onClose={() => setModal('')} title="Add member"
        footer={<><Button variant="ghost" onClick={() => setModal('')}>Cancel</Button><Button loading={busy} onClick={addMember}>Add</Button></>}>
        <div className="space-y-3">
          <Field label="Member email (existing GI user)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}><option value="member">Member</option><option value="admin">Admin</option></Select>
        </div>
      </Modal>

      <Modal open={modal === 'assign'} onClose={() => setModal('')} title="Assign a seat"
        footer={<><Button variant="ghost" onClick={() => setModal('')}>Cancel</Button><Button loading={busy} onClick={assign} disabled={!assignMember || !assignInternship}>Assign</Button></>}>
        <div className="space-y-3">
          <Select label="Member" value={assignMember} onChange={(e) => setAssignMember(Number(e.target.value))}>
            <option value="">Select…</option>
            {(team.members as Any[]).map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
          </Select>
          <Select label="Internship" value={assignInternship} onChange={(e) => setAssignInternship(Number(e.target.value))}>
            <option value="">Select…</option>
            {internships.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
          </Select>
          <p className="text-caption text-neutral-500">Uses one seat and enrolls the member.</p>
        </div>
      </Modal>
    </div>
  );
}
