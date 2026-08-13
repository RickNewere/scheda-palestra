/**
 * Dev utility: parses an .xlsx with the same code the app uses and prints the
 * result, so a new scheda can be checked before importing it in the UI.
 *
 *   node scripts/parse-check.mjs "scheda 2.xlsx"
 */
import esbuild from 'esbuild'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = process.argv[2] || 'scheda 2.xlsx'
const outFile = path.join(os.tmpdir(), `scheda-parser-${Date.now()}.mjs`)

await esbuild.build({
  entryPoints: [path.join(root, 'src/lib/parser.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: outFile,
  logLevel: 'warning',
  absWorkingDir: root,
})

const mod = await import(pathToFileURL(outFile).href)
const buf = fs.readFileSync(path.isAbsolute(file) ? file : path.join(root, file))
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
const res = mod.parseWorkbookToScheda(ab, path.basename(file))

console.log(`SCHEDA: ${res.scheda.name} | varianti: ${res.scheda.variants.join(', ')} | giorni: ${res.scheda.days.length}`)
if (res.warnings.length) console.log('WARNINGS:', res.warnings)
for (const d of res.scheda.days) {
  console.log(`\n== ${d.label} :: ${d.title} (recupero ${d.restSeconds}s)`)
  for (const e of d.exercises) {
    console.log(`  [col ${e.col}] ${e.name}`)
    console.log(
      `      scheme="${e.scheme}" sets=${e.sets} reps=${e.reps} dur=${e.durationSec} perSide=${e.perSide} kind=${e.kind}`,
    )
    console.log(`      pattern=${e.pattern} muscoli=${e.muscles.join(', ') || '-'}`)
    console.log(`      img=${e.imageId ?? '-'} nota=${e.note ?? '-'}`)
  }
}
console.log(`\nIMMAGINI (${res.images.length}):`)
for (const i of res.images) console.log(`  ${i.id} ${i.mime} ${i.data.length}b`)
fs.rmSync(outFile, { force: true })
