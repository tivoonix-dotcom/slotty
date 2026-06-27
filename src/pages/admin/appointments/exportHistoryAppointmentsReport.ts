import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { ADMIN_DESKTOP_LOGO_SRC } from '../../../app/headerLogo';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { resolveClientDisplayName } from './appointmentDetailHelpers';
import {
  formatAppointmentPrice,
  formatCardDateTime,
  formatDurationMinutes,
  historyStatusLabel,
} from './appointmentsFormat';

const BRAND = 'F47C8C';
const BRAND_SOFT = 'FFF1F4';
const INK = '111827';
const MUTED = '6B7280';
const REPORT_LOGO_MAX_WIDTH_PX = 120;

export type HistoryExportSummary = {
  completedCount: number;
  earnedTotal: number;
  cancelledCount: number;
};

export type HistoryExportParams = {
  masterName: string;
  rows: DemoMasterAppointment[];
  summary: HistoryExportSummary;
  filtersLabel: string;
  generatedAt?: Date;
};

function sanitizeFilePart(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\-_]+/gu, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchReportLogo(): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('logo load failed'));
    img.src = ADMIN_DESKTOP_LOGO_SRC;
  });

  const scale =
    img.naturalWidth > REPORT_LOGO_MAX_WIDTH_PX ? REPORT_LOGO_MAX_WIDTH_PX / img.naturalWidth : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png encode failed'))), 'image/png');
  });
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
}

function mapExportRow(appointment: DemoMasterAppointment) {
  const displayName = resolveClientDisplayName(appointment);
  return {
    when: formatCardDateTime(appointment.date, appointment.time).replace(' · ', ', '),
    client: displayName,
    phone: appointment.contact?.trim() || '—',
    service: appointment.serviceTitle,
    duration: formatDurationMinutes(appointment.durationMinutes, appointment.serviceTitle),
    status: historyStatusLabel(appointment.status),
    price: formatAppointmentPrice(appointment.priceByn),
    note: appointment.clientNote?.trim() || '',
  };
}

function cellText(text: string, opts?: { bold?: boolean; color?: string; size?: number }) {
  return new TableCell({
    verticalAlign: 'center',
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts?.bold,
            color: opts?.color ?? INK,
            size: opts?.size ?? 20,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function headerCell(text: string) {
  return new TableCell({
    shading: { fill: BRAND_SOFT },
    verticalAlign: 'center',
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: BRAND,
            size: 20,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function buildHistoryTable(rows: DemoMasterAppointment[]): Table {
  const headers = ['Дата и время', 'Клиент', 'Телефон', 'Услуга', 'Длительность', 'Статус', 'Сумма'];
  const headerRow = new TableRow({
    children: headers.map((h) => headerCell(h)),
  });

  const dataRows = rows.map((appointment) => {
    const row = mapExportRow(appointment);
    return new TableRow({
      children: [
        cellText(row.when),
        cellText(row.client),
        cellText(row.phone),
        cellText(row.service),
        cellText(row.duration),
        cellText(row.status, {
          color: row.status === 'Завершено' ? '16A34A' : 'EF4444',
          bold: true,
        }),
        cellText(row.price, { bold: true }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'F3F4F6' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'F3F4F6' },
    },
    rows: [headerRow, ...dataRows],
  });
}

function buildExportFilename(masterName: string, ext: 'docx' | 'xls'): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const master = sanitizeFilePart(masterName || 'master');
  return `SLOTTY-istoriya-${master}-${stamp}.${ext}`;
}

export async function downloadHistoryAppointmentsWordReport(params: HistoryExportParams): Promise<void> {
  if (params.rows.length === 0) {
    throw new Error('Нет записей для экспорта');
  }

  const generatedAt = (params.generatedAt ?? new Date()).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const logo = await fetchReportLogo().catch(() => null);
  const children: Paragraph[] = [];

  if (logo) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data: logo.bytes,
            transformation: { width: logo.width, height: logo.height },
          }),
        ],
      }),
    );
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'История записей',
          bold: true,
          size: 36,
          color: INK,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: params.masterName, bold: true, size: 24, color: INK, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `Сформировано: ${generatedAt}`, size: 20, color: MUTED, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `Фильтры: ${params.filtersLabel}`, size: 20, color: MUTED, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: `Завершено: ${params.summary.completedCount} · Заработано: ${params.summary.earnedTotal} BYN · Отменено: ${params.summary.cancelledCount}`,
          bold: true,
          size: 22,
          color: BRAND,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: `Записей в отчёте: ${params.rows.length}`,
          size: 20,
          color: MUTED,
          font: 'Calibri',
        }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: INK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 900, right: 900, bottom: 900, left: 900 },
          },
        },
        children: [
          ...children,
          buildHistoryTable(params.rows),
          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `SLOTTY · отчёт по истории записей`,
                size: 18,
                color: '9CA3AF',
                font: 'Calibri',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, buildExportFilename(params.masterName, 'docx'));
}

function spreadsheetCell(value: string, styleId?: string): string {
  const type = /^-?\d+([.,]\d+)?$/.test(value.replace(/\s/g, '')) ? 'Number' : 'String';
  return `<Cell${styleId ? ` ss:StyleID="${styleId}"` : ''}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

export function downloadHistoryAppointmentsExcelReport(params: HistoryExportParams): void {
  if (params.rows.length === 0) {
    throw new Error('Нет записей для экспорта');
  }

  const generatedAt = (params.generatedAt ?? new Date()).toLocaleString('ru-RU');
  const headers = ['Дата и время', 'Клиент', 'Телефон', 'Услуга', 'Длительность', 'Статус', 'Сумма, BYN', 'Комментарий'];

  const summaryRows = [
    ['История записей', params.masterName],
    ['Сформировано', generatedAt],
    ['Фильтры', params.filtersLabel],
    ['Завершено', String(params.summary.completedCount)],
    ['Заработано, BYN', String(params.summary.earnedTotal)],
    ['Отменено', String(params.summary.cancelledCount)],
    ['Записей в отчёте', String(params.rows.length)],
    ['', ''],
  ];

  const dataRows = params.rows.map((appointment) => {
    const row = mapExportRow(appointment);
    return [row.when, row.client, row.phone, row.service, row.duration, row.status, row.price.replace(/\s*BYN$/, ''), row.note];
  });

  const styles = `
    <Styles>
      <Style ss:ID="title"><Font ss:Bold="1" ss:Size="14"/><Interior ss:Color="#FFF1F4" ss:Pattern="Solid"/></Style>
      <Style ss:ID="header"><Font ss:Bold="1" ss:Color="#F47C8C"/><Interior ss:Color="#FFF1F4" ss:Pattern="Solid"/></Style>
      <Style ss:ID="muted"><Font ss:Color="#6B7280"/></Style>
    </Styles>`;

  const summaryXml = summaryRows
    .map(
      (cells) =>
        `<Row>${cells
          .map((cell, index) => spreadsheetCell(cell, index === 0 ? 'muted' : undefined))
          .join('')}</Row>`,
    )
    .join('');

  const headerXml = `<Row>${headers.map((h) => spreadsheetCell(h, 'header')).join('')}</Row>`;
  const bodyXml = dataRows
    .map((cells) => `<Row>${cells.map((cell) => spreadsheetCell(cell)).join('')}</Row>`)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${styles}
<Worksheet ss:Name="История">
<Table>
<Column ss:Width="120"/>
<Column ss:Width="140"/>
<Column ss:Width="110"/>
<Column ss:Width="180"/>
<Column ss:Width="90"/>
<Column ss:Width="90"/>
<Column ss:Width="80"/>
<Column ss:Width="200"/>
${summaryXml}
${headerXml}
${bodyXml}
</Table>
</Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  downloadBlob(blob, buildExportFilename(params.masterName, 'xls'));
}
