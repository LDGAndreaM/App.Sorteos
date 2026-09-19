import type { Raffle, RaffleTotals, SellerBreakdown, Ticket } from '../types';

export function computeTotals(tickets: Ticket[], raffle: Raffle): RaffleTotals {
  const totals: RaffleTotals = {
    available: 0,
    pending: 0,
    partial: 0,
    paid: 0,
    totalCollected: 0,
    totalPending: 0,
  };

  for (const ticket of tickets) {
    totals[ticket.status] += 1;
    totals.totalCollected += ticket.amountPaid;
    if (ticket.status === 'pending') totals.totalPending += raffle.ticketPrice;
    if (ticket.status === 'partial') totals.totalPending += Math.max(raffle.ticketPrice - ticket.amountPaid, 0);
  }

  return totals;
}

export function computeSellerBreakdown(tickets: Ticket[]): SellerBreakdown[] {
  const byUid = new Map<string, SellerBreakdown>();

  for (const ticket of tickets) {
    if (!ticket.soldByUid) continue;
    const entry = byUid.get(ticket.soldByUid) ?? {
      uid: ticket.soldByUid,
      name: ticket.soldByName ?? 'Sin nombre',
      ticketsSold: 0,
      totalCollected: 0,
    };
    entry.ticketsSold += 1;
    entry.totalCollected += ticket.amountPaid;
    byUid.set(ticket.soldByUid, entry);
  }

  return Array.from(byUid.values()).sort((a, b) => b.ticketsSold - a.ticketsSold);
}
