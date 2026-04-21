export type StudyType = 'word' | 'sent' | 'dialog'
export type AppScreen = 'menu' | 'list' | 'study' | 'quiz'
export type CardMode = 'saved' | 'random'

export interface WordSet {
  id: string
  name: string
  type: StudyType
  sort_order: number
  created_at: string
  is_default?: boolean
  owner_id?: string | null
  words?: Word[]
  word_count?: number
  line_count?: number
}

export interface Word {
  id: string
  set_id: string
  jp: string
  hira: string
  ko: string
  sort_order: number
}

export interface DialogLine {
  id: string
  set_id: string
  speaker: 'A' | 'B'
  jp: string
  hira: string
  ko: string
  sort_order: number
}

export interface DialogVocab {
  id: string
  set_id: string
  jp: string
  hira: string
  ko: string
  sort_order: number
}

export interface DialogExpression {
  id: string
  set_id: string
  jp: string
  hira: string
  ko: string
  sort_order: number
}

export interface DialogSetData {
  lines: DialogLine[]
  vocab: DialogVocab[]
  expressions: DialogExpression[]
}
