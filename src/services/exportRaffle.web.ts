import * as XLSX from 'xlsx';

import type { Raffle, Ticket } from '../types';
import { buildRaffleWorkbook } from './raffleWorkbook';

export async function exportRaffleToExcel(raffle: Raffle, tickets: Ticket[]): Promise<void> {
  const { workbook, fileName } = buildRaffleWorkbook(raffle, tickets);
  const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(url);
  }
}
