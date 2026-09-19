import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import type { Raffle, Ticket } from '../types';
import { buildRaffleWorkbook } from './raffleWorkbook';

export async function exportRaffleToExcel(raffle: Raffle, tickets: Ticket[]): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartir archivos no está disponible en este dispositivo.');
  }

  const { workbook, fileName } = buildRaffleWorkbook(raffle, tickets);
  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' }) as string;

  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(base64, { encoding: 'base64' });

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: `Exportar ${raffle.name}`,
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });
}
