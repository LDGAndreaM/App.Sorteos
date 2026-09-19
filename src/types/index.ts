export type TicketStatus = 'available' | 'pending' | 'partial' | 'paid';

export type RaffleStatus = 'active' | 'closed';

export interface RaffleMemberInfo {
  name: string;
  joinedAt: number;
}

export interface Raffle {
  id: string;
  name: string;
  description: string;
  prize: string;
  ticketPrice: number;
  ticketCount: number;
  startNumber: number;
  endNumber: number;
  numberDigits: number;
  inviteCode: string;
  status: RaffleStatus;
  createdBy: string;
  createdByName: string;
  memberIds: string[];
  members: Record<string, RaffleMemberInfo>;
  createdAt: number;
  updatedAt: number;
  closedAt: number | null;
}

export interface Ticket {
  number: number;
  status: TicketStatus;
  buyerName: string | null;
  buyerWhatsapp: string | null;
  amountPaid: number;
  soldByUid: string | null;
  soldByName: string | null;
  updatedAt: number;
  updatedByUid: string | null;
  updatedByName: string | null;
}

export interface UserProfile {
  uid: string;
  name: string;
  createdAt: number;
}

export interface CreateRaffleInput {
  name: string;
  description: string;
  prize: string;
  ticketPrice: number;
  ticketCount: number;
  startNumber: number;
}

export interface SellTicketInput {
  buyerName: string;
  buyerWhatsapp: string;
  status: TicketStatus;
  amountPaid: number;
}

export interface RaffleTotals {
  available: number;
  pending: number;
  partial: number;
  paid: number;
  totalCollected: number;
  totalPending: number;
}

export interface SellerBreakdown {
  uid: string;
  name: string;
  ticketsSold: number;
  totalCollected: number;
}
