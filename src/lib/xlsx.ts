/**
 * Minimal xlsx reader.
 * Reads cell values and, unlike most spreadsheet libraries, also the pictures
 * embedded in the sheet together with the cell range they are anchored to.
 * That anchor is what lets the app pair every photo with its exercise.
 */
import { unzipSync, strFromU8 } from 'fflate'

export interface SheetPicture {
  /** Stable key, derived from the media path inside the workbook. */
  id: string
  mime: string
  data: Uint8Array
  fromCol: number
  fromRow: number
  toCol: number
  toRow: number
  /** Column the picture is visually centred on. */
  centerCol: number
  descr: string
}

export interface Sheet {
  name: string
  cells: Map<string, string>
  maxRow: number
  maxCol: number
  pictures: SheetPicture[]
}

export interface Workbook {
  sheets: Sheet[]
}

const EMU_PER_PX = 9525
const DEFAULT_COL_WIDTH = 8.43

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  emf: 'image/emf',
  wmf: 'image/wmf',
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function tagBlocks(xml: string, tag: string): string[] {
  const out: string[] = []
  const re = new RegExp(`<(?:\\w+:)?${tag}(?:\\s[^>]*)?(?:/>|>)`, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    if (m[0].endsWith('/>')) {
      out.push(m[0])
      continue
    }
    const closeRe = new RegExp(`</(?:\\w+:)?${tag}>`, 'g')
    closeRe.lastIndex = re.lastIndex
    const close = closeRe.exec(xml)
    if (!close) break
    out.push(xml.slice(m.index, close.index + close[0].length))
    re.lastIndex = close.index + close[0].length
  }
  return out
}

function attr(chunk: string, name: string): string | null {
  const m = chunk.match(new RegExp(`\\s${name}="([^"]*)"`))
  return m ? decodeEntities(m[1]) : null
}

function intOf(chunk: string, tag: string): number {
  const m = chunk.match(new RegExp(`<(?:\\w+:)?${tag}>(-?\\d+)</(?:\\w+:)?${tag}>`))
  return m ? parseInt(m[1], 10) : 0
}

function innerText(chunk: string): string {
  const parts = chunk.match(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g)
  if (!parts) return ''
  return parts
    .map((p) => decodeEntities(p.replace(/<[^>]+>/g, '')))
    .join('')
}

export function colToLetter(col: number): string {
  let n = col + 1
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export function letterToCol(letters: string): number {
  let n = 0
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function parseSharedStrings(xml: string): string[] {
  return tagBlocks(xml, 'si').map((si) => innerText(si).trim())
}

/** Resolves a relationship target against the folder holding the source part. */
function resolveTarget(baseDir: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1)
  const parts = baseDir.split('/').filter(Boolean)
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

function parseRels(xml: string, baseDir: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const rel of tagBlocks(xml, 'Relationship')) {
    const id = attr(rel, 'Id')
    const target = attr(rel, 'Target')
    const mode = attr(rel, 'TargetMode')
    if (!id || !target || mode === 'External') continue
    map.set(id, resolveTarget(baseDir, target))
  }
  return map
}

function dirOf(path: string): string {
  const i = path.lastIndexOf('/')
  return i < 0 ? '' : path.slice(0, i)
}

function parseColWidths(sheetXml: string): Map<number, number> {
  const widths = new Map<number, number>()
  const colsBlock = sheetXml.match(/<cols>[\s\S]*?<\/cols>/)
  if (!colsBlock) return widths
  for (const col of tagBlocks(colsBlock[0], 'col')) {
    const min = parseInt(attr(col, 'min') || '0', 10)
    const max = parseInt(attr(col, 'max') || '0', 10)
    const width = parseFloat(attr(col, 'width') || '0')
    if (!min || !width) continue
    for (let c = min; c <= max && c <= 1000; c++) widths.set(c - 1, width)
  }
  return widths
}

function colEmu(widths: Map<number, number>, col: number): number {
  const chars = widths.get(col) ?? DEFAULT_COL_WIDTH
  return (Math.round(chars * 7) + 5) * EMU_PER_PX
}

function colStartEmu(widths: Map<number, number>, col: number): number {
  let x = 0
  for (let c = 0; c < col; c++) x += colEmu(widths, c)
  return x
}

function columnAtEmu(widths: Map<number, number>, x: number): number {
  let acc = 0
  for (let c = 0; c < 1000; c++) {
    const w = colEmu(widths, c)
    if (x < acc + w) return c
    acc += w
  }
  return 999
}

interface Anchor {
  rId: string
  descr: string
  fromCol: number
  fromColOff: number
  fromRow: number
  toCol: number
  toColOff: number
  toRow: number
  extCx: number
}

function parseDrawing(xml: string): Anchor[] {
  const anchors: Anchor[] = []
  const blocks = [
    ...tagBlocks(xml, 'twoCellAnchor'),
    ...tagBlocks(xml, 'oneCellAnchor'),
    ...tagBlocks(xml, 'absoluteAnchor'),
  ]
  for (const block of blocks) {
    const embed = block.match(/r:embed="([^"]+)"/)
    if (!embed) continue
    const fromBlock = block.match(/<(?:\w+:)?from>[\s\S]*?<\/(?:\w+:)?from>/)
    const toBlock = block.match(/<(?:\w+:)?to>[\s\S]*?<\/(?:\w+:)?to>/)
    const ext = block.match(/<(?:\w+:)?ext\s+cx="(\d+)"\s+cy="(\d+)"\s*\/>/)
    const descrMatch = block.match(/<(?:\w+:)?cNvPr\b[^>]*>/)
    const descr = descrMatch ? attr(descrMatch[0], 'descr') || attr(descrMatch[0], 'name') || '' : ''
    if (!fromBlock) continue
    const from = fromBlock[0]
    const anchor: Anchor = {
      rId: embed[1],
      descr,
      fromCol: intOf(from, 'col'),
      fromColOff: intOf(from, 'colOff'),
      fromRow: intOf(from, 'row'),
      toCol: -1,
      toColOff: 0,
      toRow: -1,
      extCx: ext ? parseInt(ext[1], 10) : 0,
    }
    if (toBlock) {
      const to = toBlock[0]
      anchor.toCol = intOf(to, 'col')
      anchor.toColOff = intOf(to, 'colOff')
      anchor.toRow = intOf(to, 'row')
    }
    anchors.push(anchor)
  }
  return anchors
}

function parseSheetCells(sheetXml: string, shared: string[]) {
  const cells = new Map<string, string>()
  let maxRow = 0
  let maxCol = 0
  const cellRe = /<c\b([^>]*?)(\/>|>)/g
  let m: RegExpExecArray | null
  while ((m = cellRe.exec(sheetXml))) {
    const head = m[1]
    let body = ''
    if (m[2] === '>') {
      const end = sheetXml.indexOf('</c>', cellRe.lastIndex)
      if (end < 0) break
      body = sheetXml.slice(cellRe.lastIndex, end)
      cellRe.lastIndex = end + 4
    }
    const ref = attr(`<c${head}>`, 'r')
    if (!ref) continue
    const type = attr(`<c${head}>`, 't') || 'n'
    let value = ''
    if (type === 's') {
      const v = body.match(/<v>([\s\S]*?)<\/v>/)
      if (v) value = shared[parseInt(v[1], 10)] ?? ''
    } else if (type === 'inlineStr') {
      value = innerText(body)
    } else {
      const v = body.match(/<v>([\s\S]*?)<\/v>/)
      if (v) value = decodeEntities(v[1])
    }
    value = value.replace(/ /g, ' ').trim()
    if (!value) continue
    const parts = ref.match(/^([A-Z]+)(\d+)$/)
    if (!parts) continue
    const col = letterToCol(parts[1])
    const row = parseInt(parts[2], 10)
    cells.set(ref, value)
    if (row > maxRow) maxRow = row
    if (col + 1 > maxCol) maxCol = col + 1
  }
  return { cells, maxRow, maxCol }
}

export function readWorkbook(buffer: ArrayBuffer): Workbook {
  const files = unzipSync(new Uint8Array(buffer))
  const text = (path: string): string | null =>
    files[path] ? strFromU8(files[path]) : null

  const wbXml = text('xl/workbook.xml')
  if (!wbXml) throw new Error('File non valido: manca xl/workbook.xml')

  const wbRels = parseRels(text('xl/_rels/workbook.xml.rels') || '', 'xl')
  const sharedXml = text('xl/sharedStrings.xml')
  const shared = sharedXml ? parseSharedStrings(sharedXml) : []

  const sheets: Sheet[] = []
  for (const sheetTag of tagBlocks(wbXml, 'sheet')) {
    const name = attr(sheetTag, 'name') || `Foglio ${sheets.length + 1}`
    const rid = attr(sheetTag, 'r:id') || attr(sheetTag, 'id')
    const path = rid ? wbRels.get(rid) : null
    const sheetXml = path ? text(path) : null
    if (!sheetXml || !path) continue

    const { cells, maxRow, maxCol } = parseSheetCells(sheetXml, shared)
    const widths = parseColWidths(sheetXml)
    const pictures: SheetPicture[] = []

    const sheetRels = parseRels(
      text(`${dirOf(path)}/_rels/${path.split('/').pop()}.rels`) || '',
      dirOf(path),
    )
    const drawingTag = sheetXml.match(/<drawing\b[^>]*>/)
    const drawingPath = drawingTag ? sheetRels.get(attr(drawingTag[0], 'r:id') || '') : null
    if (drawingPath) {
      const drawingXml = text(drawingPath)
      const drawingRels = parseRels(
        text(`${dirOf(drawingPath)}/_rels/${drawingPath.split('/').pop()}.rels`) || '',
        dirOf(drawingPath),
      )
      if (drawingXml) {
        for (const a of parseDrawing(drawingXml)) {
          const mediaPath = drawingRels.get(a.rId)
          const bytes = mediaPath ? files[mediaPath] : undefined
          if (!mediaPath || !bytes) continue
          const ext = (mediaPath.split('.').pop() || '').toLowerCase()
          const x1 = colStartEmu(widths, a.fromCol) + a.fromColOff
          const x2 =
            a.toCol >= 0
              ? colStartEmu(widths, a.toCol) + a.toColOff
              : x1 + (a.extCx || colEmu(widths, a.fromCol))
          const centerCol = columnAtEmu(widths, (x1 + x2) / 2)
          pictures.push({
            id: mediaPath.replace(/[^a-zA-Z0-9._-]/g, '_'),
            mime: MIME_BY_EXT[ext] || 'application/octet-stream',
            data: bytes,
            fromCol: a.fromCol,
            fromRow: a.fromRow + 1,
            toCol: a.toCol >= 0 ? a.toCol : a.fromCol,
            toRow: (a.toRow >= 0 ? a.toRow : a.fromRow) + 1,
            centerCol,
            descr: a.descr,
          })
        }
      }
    }

    sheets.push({ name, cells, maxRow, maxCol, pictures })
  }

  if (!sheets.length) throw new Error('Nessun foglio leggibile nel file')
  return { sheets }
}

export function cellAt(sheet: Sheet, row: number, col: number): string {
  return sheet.cells.get(`${colToLetter(col)}${row}`) || ''
}
