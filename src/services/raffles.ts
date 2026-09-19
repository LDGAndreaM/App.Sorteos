import {
  type DocumentData,
  type QueryDocumentSnapshot,
  Timestamp,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '../config/firebase';
import type { CreateRaffleInput, Raffle, RaffleStatus, SellTicketInput, Ticket } from '../types';
import { generateInviteCode, normalizeInviteCode } from '../utils/code';

const TICKET_BATCH_SIZE = 400;

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

function raffleFromDoc(snap: QueryDocumentSnapshot<DocumentData>): Raffle {
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name ?? '',
    description: data.description ?? '',
    prize: data.prize ?? '',
    ticketPrice: data.ticketPrice ?? 0,
    ticketCount: data.ticketCount ?? 0,
    startNumber: data.startNumber ?? 0,
    endNumber: data.endNumber ?? 0,
    numberDigits: data.numberDigits ?? 1,
    inviteCode: data.inviteCode ?? '',
    status: (data.status as RaffleStatus) ?? 'active',
    createdBy: data.createdBy ?? '',
    createdByName: data.createdByName ?? '',
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    members: data.members ?? {},
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    closedAt: data.closedAt ? toMillis(data.closedAt) : null,
  };
}

function ticketFromDoc(snap: QueryDocumentSnapshot<DocumentData>): Ticket {
  const data = snap.data();
  return {
    number: data.number,
    status: data.status ?? 'available',
    buyerName: data.buyerName ?? null,
    buyerWhatsapp: data.buyerWhatsapp ?? null,
    amountPaid: data.amountPaid ?? 0,
    soldByUid: data.soldByUid ?? null,
    soldByName: data.soldByName ?? null,
    updatedAt: toMillis(data.updatedAt),
    updatedByUid: data.updatedByUid ?? null,
    updatedByName: data.updatedByName ?? null,
  };
}

export class TicketUnavailableError extends Error {
  constructor() {
    super('Ese número ya fue vendido por otra persona. Elige otro boleto.');
    this.name = 'TicketUnavailableError';
  }
}

export async function createRaffle(
  input: CreateRaffleInput,
  creatorUid: string,
  creatorName: string
): Promise<string> {
  const raffleRef = doc(collection(db, 'raffles'));
  const endNumber = input.startNumber + input.ticketCount - 1;
  const numberDigits = String(endNumber).length;

  await setDoc(raffleRef, {
    name: input.name.trim(),
    description: input.description.trim(),
    prize: input.prize.trim(),
    ticketPrice: input.ticketPrice,
    ticketCount: input.ticketCount,
    startNumber: input.startNumber,
    endNumber,
    numberDigits,
    inviteCode: generateInviteCode(),
    status: 'active',
    createdBy: creatorUid,
    createdByName: creatorName,
    memberIds: [creatorUid],
    members: { [creatorUid]: { name: creatorName, joinedAt: Date.now() } },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    closedAt: null,
  });

  const numbers = Array.from({ length: input.ticketCount }, (_, i) => input.startNumber + i);
  for (let i = 0; i < numbers.length; i += TICKET_BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const n of numbers.slice(i, i + TICKET_BATCH_SIZE)) {
      const ticketRef = doc(db, 'raffles', raffleRef.id, 'tickets', String(n));
      batch.set(ticketRef, {
        number: n,
        status: 'available',
        buyerName: null,
        buyerWhatsapp: null,
        amountPaid: 0,
        soldByUid: null,
        soldByName: null,
        updatedAt: serverTimestamp(),
        updatedByUid: null,
        updatedByName: null,
      });
    }
    await batch.commit();
  }

  return raffleRef.id;
}

export async function joinRaffleByCode(code: string, uid: string, name: string): Promise<Raffle> {
  const normalized = normalizeInviteCode(code);
  if (!normalized) throw new Error('Escribe un código de invitación.');

  const q = query(collection(db, 'raffles'), where('inviteCode', '==', normalized));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('No se encontró ninguna rifa con ese código.');

  const raffleSnap = snap.docs[0];
  const raffle = raffleFromDoc(raffleSnap);
  if (raffle.memberIds.includes(uid)) return raffle;

  await updateDoc(raffleSnap.ref, {
    memberIds: arrayUnion(uid),
    [`members.${uid}`]: { name, joinedAt: Date.now() },
    updatedAt: serverTimestamp(),
  });

  return {
    ...raffle,
    memberIds: [...raffle.memberIds, uid],
    members: { ...raffle.members, [uid]: { name, joinedAt: Date.now() } },
  };
}

export function subscribeToUserRaffles(
  uid: string,
  status: RaffleStatus,
  callback: (raffles: Raffle[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, 'raffles'),
    where('memberIds', 'array-contains', uid),
    where('status', '==', status)
  );
  return onSnapshot(
    q,
    (snap) => {
      const raffles = snap.docs.map(raffleFromDoc).sort((a, b) => b.createdAt - a.createdAt);
      callback(raffles);
    },
    (error) => onError?.(error)
  );
}

export function subscribeToRaffle(
  raffleId: string,
  callback: (raffle: Raffle | null) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    doc(db, 'raffles', raffleId),
    (snap) => callback(snap.exists() ? raffleFromDoc(snap as QueryDocumentSnapshot<DocumentData>) : null),
    (error) => onError?.(error)
  );
}

export function subscribeToTickets(
  raffleId: string,
  callback: (tickets: Ticket[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, 'raffles', raffleId, 'tickets'), orderBy('number', 'asc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(ticketFromDoc)),
    (error) => onError?.(error)
  );
}

export async function claimTicket(
  raffleId: string,
  ticketNumber: number,
  input: SellTicketInput,
  actorUid: string,
  actorName: string
): Promise<void> {
  const ref = doc(db, 'raffles', raffleId, 'tickets', String(ticketNumber));
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Ese boleto no existe.');
    if (snap.data().status !== 'available') throw new TicketUnavailableError();

    tx.update(ref, {
      status: input.status,
      buyerName: input.buyerName.trim(),
      buyerWhatsapp: input.buyerWhatsapp.trim(),
      amountPaid: input.amountPaid,
      soldByUid: actorUid,
      soldByName: actorName,
      updatedAt: serverTimestamp(),
      updatedByUid: actorUid,
      updatedByName: actorName,
    });
  });
}

export async function updateTicket(
  raffleId: string,
  ticketNumber: number,
  input: SellTicketInput,
  actorUid: string,
  actorName: string
): Promise<void> {
  const ref = doc(db, 'raffles', raffleId, 'tickets', String(ticketNumber));
  await updateDoc(ref, {
    status: input.status,
    buyerName: input.buyerName.trim(),
    buyerWhatsapp: input.buyerWhatsapp.trim(),
    amountPaid: input.amountPaid,
    updatedAt: serverTimestamp(),
    updatedByUid: actorUid,
    updatedByName: actorName,
  });
}

export async function releaseTicket(
  raffleId: string,
  ticketNumber: number,
  actorUid: string,
  actorName: string
): Promise<void> {
  const ref = doc(db, 'raffles', raffleId, 'tickets', String(ticketNumber));
  await updateDoc(ref, {
    status: 'available',
    buyerName: null,
    buyerWhatsapp: null,
    amountPaid: 0,
    soldByUid: null,
    soldByName: null,
    updatedAt: serverTimestamp(),
    updatedByUid: actorUid,
    updatedByName: actorName,
  });
}

export async function closeRaffle(raffleId: string): Promise<void> {
  await updateDoc(doc(db, 'raffles', raffleId), {
    status: 'closed',
    closedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function reopenRaffle(raffleId: string): Promise<void> {
  await updateDoc(doc(db, 'raffles', raffleId), {
    status: 'active',
    closedAt: null,
    updatedAt: serverTimestamp(),
  });
}
