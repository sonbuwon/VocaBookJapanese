/**
 * 단어 데이터 Export 유틸리티
 */

type WordRow = { jp: string; hira: string; ko: string }

/** 세트 하나를 CSV 파일로 다운로드 (import 포맷과 호환) */
export function downloadSetAsCsv(setName: string, words: WordRow[]) {
  const lines = words.map(w =>
    [w.jp, w.hira, w.ko].map(escapeCsvField).join(',')
  )
  // UTF-8 BOM 포함 → Excel 한/일 문자 깨짐 방지
  const content = '\uFEFF' + lines.join('\n')
  triggerDownload(sanitizeFilename(setName) + '.csv', content, 'text/csv;charset=utf-8;')
}

/** 현재 탭의 전체 세트를 JSON 파일로 다운로드 */
export function downloadAllSetsAsJson(
  typeName: string,
  sets: { name: string; words: WordRow[] }[],
) {
  const exportedAt = new Date().toISOString().slice(0, 10)
  const payload = {
    exportedAt,
    type: typeName,
    totalSets: sets.length,
    totalWords: sets.reduce((acc, s) => acc + s.words.length, 0),
    sets: sets.map(s => ({
      name: s.name,
      wordCount: s.words.length,
      words: s.words,
    })),
  }
  const filename = `단어장_${typeName}_${exportedAt}.json`
  triggerDownload(filename, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8;')
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function escapeCsvField(field: string): string {
  // 쉼표·줄바꿈·큰따옴표가 포함된 경우 따옴표로 감싸기
  if (/[,\n\r"]/.test(field)) {
    return '"' + field.replace(/"/g, '""') + '"'
  }
  return field
}

function sanitizeFilename(name: string): string {
  // Windows/macOS 금지 문자 제거
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'export'
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
