/**
 * Turns a workbook into a Scheda.
 *
 * Expected layout, repeated once per day anywhere on the sheet:
 *
 *   C12  Giorno 1
 *   C13  Gambe + Upper   D13 Leg press    E13 Leg curl   ...
 *   C14  Default         D14 3x12         E14 3x12       ...
 *   C25  Recupero 3'     D25 nota         E25 nota       ...
 *
 * Pictures are paired with the exercise sitting in the column they are
 * centred on, inside the closest day block.
 */
import { readWorkbook, cellAt, type Sheet, type SheetPicture } from './xlsx'
import { parseScheme, parseDuration } from './scheme'
import { metaFor } from './exerciseMeta'
import type { Day, Exercise, Scheda } from '../types'

export interface ParsedImage {
  id: string
  mime: string
  data: Uint8Array
}

export interface ParseResult {
  scheda: Scheda
  images: ParsedImage[]
  warnings: string[]
}

const DAY_RE = /^\s*giorno\s*([0-9]+|[ivxlc]+)?\s*[:.-]?\s*$/i
const REST_RE = /^\s*(recupero|riposo|rest|pausa)\b/i
const DEFAULT_REST = 90

let counter = 0
export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

interface DayBlock {
  sheet: Sheet
  headerRow: number
  nameRow: number
  labelCol: number
  label: string
  endRow: number
}

function findDayBlocks(sheet: Sheet): DayBlock[] {
  const blocks: DayBlock[] = []
  for (const [ref, value] of sheet.cells) {
    if (!DAY_RE.test(value)) continue
    const m = ref.match(/^([A-Z]+)(\d+)$/)
    if (!m) continue
    const col = m[1].split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1
    const row = parseInt(m[2], 10)
    blocks.push({
      sheet,
      headerRow: row,
      nameRow: row + 1,
      labelCol: col,
      label: value.trim(),
      endRow: sheet.maxRow,
    })
  }
  blocks.sort((a, b) => a.headerRow - b.headerRow)
  blocks.forEach((b, i) => {
    b.endRow = i + 1 < blocks.length ? blocks[i + 1].headerRow - 1 : sheet.maxRow
  })
  return blocks
}

/** Distance between a picture row span and the row an exercise name sits on. */
function rowDistance(pic: SheetPicture, row: number): number {
  if (row >= pic.fromRow && row <= pic.toRow) return 0
  return row < pic.fromRow ? pic.fromRow - row : row - pic.toRow
}

function assignPictures(blocks: DayBlock[], sheet: Sheet): Map<number, Map<number, SheetPicture>> {
  // block index -> column -> picture
  const byBlock = new Map<number, Map<number, SheetPicture>>()
  blocks.forEach((_, i) => byBlock.set(i, new Map()))
  if (!blocks.length) return byBlock

  const sorted = [...sheet.pictures].sort((a, b) => a.fromCol - b.fromCol || a.fromRow - b.fromRow)
  for (const pic of sorted) {
    let best = 0
    let bestDist = Infinity
    blocks.forEach((b, i) => {
      const d = rowDistance(pic, b.nameRow)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    const slots = byBlock.get(best)!
    if (!slots.has(pic.centerCol)) {
      slots.set(pic.centerCol, pic)
      continue
    }
    // The centre column is taken: fall back to a free column the picture spans.
    let placed = false
    for (let c = pic.fromCol; c <= pic.toCol; c++) {
      if (!slots.has(c)) {
        slots.set(c, pic)
        placed = true
        break
      }
    }
    if (!placed) slots.set(-Math.abs(pic.fromCol) - 1000, pic)
  }
  return byBlock
}

function buildDay(
  block: DayBlock,
  index: number,
  pictures: Map<number, SheetPicture>,
  warnings: string[],
): Day | null {
  const { sheet, labelCol, nameRow, endRow } = block
  const names: { col: number; name: string }[] = []
  for (let col = labelCol + 1; col < Math.max(sheet.maxCol, labelCol + 30); col++) {
    const value = cellAt(sheet, nameRow, col)
    if (value) names.push({ col, name: value })
  }
  if (!names.length) {
    warnings.push(`${block.label}: nessun esercizio trovato nella riga ${nameRow}`)
    return null
  }

  const schemeRows: { label: string; values: Map<number, string> }[] = []
  const notes = new Map<number, string>()
  let restSeconds = DEFAULT_REST

  for (let row = nameRow + 1; row <= endRow; row++) {
    const rowLabel = cellAt(sheet, row, labelCol)
    const values = new Map<number, string>()
    for (const { col } of names) {
      const v = cellAt(sheet, row, col)
      if (v) values.set(col, v)
    }
    if (!rowLabel && !values.size) continue
    if (REST_RE.test(rowLabel)) {
      const parsed = parseDuration(rowLabel.replace(REST_RE, ''))
      if (parsed) restSeconds = parsed
      for (const [col, v] of values) {
        const clean = v.replace(/^\s*\*+\s*/, '').trim()
        notes.set(col, notes.has(col) ? `${notes.get(col)} · ${clean}` : clean)
      }
      continue
    }
    if (values.size) {
      schemeRows.push({ label: rowLabel || 'Default', values })
    }
  }

  if (!schemeRows.length) warnings.push(`${block.label}: nessuno schema serie trovato`)

  const exercises: Exercise[] = names.map(({ col, name }, i) => {
    const schemes: Record<string, string> = {}
    for (const row of schemeRows) {
      const v = row.values.get(col)
      if (v) schemes[row.label] = v
    }
    const firstLabel = Object.keys(schemes)[0]
    const raw = firstLabel ? schemes[firstLabel] : ''
    const parsed = parseScheme(raw)
    const meta = metaFor(name)
    const pic = pictures.get(col)
    return {
      id: uid('ex'),
      col,
      order: i,
      name: name.trim(),
      scheme: raw,
      schemes,
      sets: parsed.sets,
      reps: parsed.reps,
      durationSec: parsed.durationSec,
      perSide: parsed.perSide,
      kind: meta.cardio ? 'cardio' : parsed.kind,
      note: notes.get(col) || null,
      imageId: pic ? pic.id : null,
      pattern: meta.pattern,
      muscles: meta.muscles,
    }
  })

  const title = cellAt(sheet, nameRow, labelCol) || block.label
  const dayNumber = block.label.match(/(\d+)/)
  return {
    id: uid('day'),
    index: dayNumber ? parseInt(dayNumber[1], 10) : index + 1,
    label: block.label.replace(/\s*:\s*$/, ''),
    title,
    restSeconds,
    exercises,
  }
}

export function parseWorkbookToScheda(buffer: ArrayBuffer, fileName: string): ParseResult {
  const wb = readWorkbook(buffer)
  const warnings: string[] = []
  const days: Day[] = []
  const images: ParsedImage[] = []
  const usedImages = new Set<string>()

  for (const sheet of wb.sheets) {
    const blocks = findDayBlocks(sheet)
    if (!blocks.length) continue
    const picturesByBlock = assignPictures(blocks, sheet)
    blocks.forEach((block, i) => {
      const day = buildDay(block, days.length, picturesByBlock.get(i) || new Map(), warnings)
      if (!day) return
      days.push(day)
      for (const ex of day.exercises) {
        if (!ex.imageId || usedImages.has(ex.imageId)) continue
        const pic = sheet.pictures.find((p) => p.id === ex.imageId)
        if (pic) {
          usedImages.add(pic.id)
          images.push({ id: pic.id, mime: pic.mime, data: pic.data })
        }
      }
    })
  }

  if (!days.length) {
    throw new Error(
      'Nessun giorno trovato. Serve una cella "Giorno 1" con sotto il titolo, i nomi degli esercizi e la riga delle serie.',
    )
  }

  const variants = Array.from(
    new Set(days.flatMap((d) => d.exercises.flatMap((e) => Object.keys(e.schemes)))),
  )

  const scheda: Scheda = {
    id: uid('sch'),
    name: fileName.replace(/\.(xlsx|xlsm|xls)$/i, '').replace(/[_-]+/g, ' ').trim() || 'Scheda',
    sourceFile: fileName,
    importedAt: Date.now(),
    variant: variants[0] || 'Default',
    variants: variants.length ? variants : ['Default'],
    days: days.sort((a, b) => a.index - b.index),
  }

  return { scheda, images, warnings }
}

/** Re-reads every exercise scheme when the user switches variant. */
export function applyVariant(scheda: Scheda, variant: string): Scheda {
  return {
    ...scheda,
    variant,
    days: scheda.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) => {
        const raw = ex.schemes[variant] ?? ex.scheme
        const parsed = parseScheme(raw)
        return {
          ...ex,
          scheme: raw,
          sets: parsed.sets,
          reps: parsed.reps,
          durationSec: parsed.durationSec,
          perSide: parsed.perSide,
          kind: ex.kind === 'cardio' ? 'cardio' : parsed.kind,
        }
      }),
    })),
  }
}
