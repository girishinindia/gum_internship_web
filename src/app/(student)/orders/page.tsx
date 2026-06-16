'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { StatusBadge, Button, EmptyState, SkeletonCard } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Order = Record<string, any>;

export default function OrdersPage(): JSX.Element {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);

  const load = async (): Promise<void> => {
    const { data } = await api<Order[]>('/orders/me');
    setOrders(data);
  };
  useEffect(() => { void load().catch(() => setOrders([])); }, []);

  const invoice = async (id: number): Promise<void> => {
    try {
      const { data } = await api<{ url: string }>(`/orders/${id}/invoice`);
      window.open(data.url, '_blank', 'noopener');
    } catch {
      toast('danger', 'Invoice not ready yet — paid orders only.');
    }
  };

  const refundRequest = async (id: number): Promise<void> => {
    try {
      await api(`/orders/${id}/refund-request`, { method: 'POST', body: JSON.stringify({ reason: 'Requested from web' }) });
      toast('success', 'Refund request submitted.');
      void load();
    } catch {
      toast('danger', 'Could not submit refund request.');
    }
  };

  if (!orders) return <div className="space-y-4"><h1 className="text-h1">Orders</h1><SkeletonCard /><SkeletonCard /></div>;

  return (
    <div>
      <h1 className="text-h1">Orders &amp; invoices</h1>
      {orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders yet" message="Paid enrollments and their GST invoices will appear here." />
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-800">{o.internshipTitle ?? `Order ${o.orderNo}`}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-0.5 text-caption text-neutral-500">
                  {o.orderNo} · {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {o.invoiceNo && <> · {o.invoiceNo}</>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-body font-semibold">{inr(Number(o.totalAmount))}</span>
                {o.status === 'paid' && <Button size="sm" variant="outline" onClick={() => invoice(o.id)}>Invoice</Button>}
                {o.status === 'paid' && <Button size="sm" variant="ghost" onClick={() => refundRequest(o.id)}>Refund</Button>}
                {(o.status === 'created' || o.status === 'pending') && (
                  <a href={`/checkout/${o.internshipSlug ?? ''}`} className="text-body-sm font-medium text-primary-700 hover:underline">Complete payment</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {orders.some((o) => o.igstAmount > 0 || o.cgstAmount > 0) && (
        <p className="mt-4 text-caption text-neutral-400">Invoices include the GST split (CGST/SGST intra-state, IGST inter-state).</p>
      )}
    </div>
  );
}
