import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import type { Raffle, Ticket, TicketStatus } from '../types';
import { formatTicketNumber } from '../utils/format';

const STATUS_LABELS: Record<TicketStatus, string> = {
  available: 'Disponible',
  pending: 'Pendiente de pago',
  partial: 'Abonado',
  paid: 'Pagado completo',
};

function sanitizeFileName(name: string): string {
  const cleaned = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return cleaned || 'rifa';
}

export async function exportRaffleToExcel(raffle: Raffle, tickets: Ticket[]): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartir archivos no está disponible en este dispositivo.');
  }

  const sold = tickets.filter((t) => t.status !== 'available');

  const ticketRows = sold
    .sort((a, b) => a.number - b.number)
    .map((t) => ({
      Numero: formatTicketNumber(t.number, raffle.numberDigits),
      Comprador: t.buyerName ?? '',
      WhatsApp: t.buyerWhatsapp ?? '',
      Estatus: STATUS_LABELS[t.status],
      Pagado: t.amountPaid,
      Pendiente: Math.max(raffle.ticketPrice - t.amountPaid, 0),
      Vendedor: t.soldByName ?? '',
    }));

  const summaryRows: [string, string | number][] = [
    ['Rifa', raffle.name],
    ['Premio', raffle.prize],
    ['Costo del boleto', raffle.ticketPrice],
    ['Total de numeros', raffle.ticketCount],
    ['Boletos vendidos', sold.length],
    ['Boletos disponibles', tickets.length - sold.length],
    ['Recaudado', sold.reduce((sum, t) => sum + t.amountPaid, 0)],
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ticketRows), 'Boletos vendidos');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), 'Resumen');

  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' }) as string;

  const fileName = `rifa-${sanitizeFileName(raffle.name)}-${raffle.inviteCode}.xlsx`;
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(base64, { encoding: 'base64' });

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: `Exportar ${raffle.name}`,
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });
}
