export type StudyType = 'word' | 'sent'
export type AppScreen = 'menu' | 'list' | 'study'
export type CardMode = 'saved' | 'random'

export interface WordSet {
  id: string
  name: string
  type: StudyType
  created_at: string
  words?: Word[]
  word_count?: number
}

export interface Word {
  id: string
  set_id: string
  jp: string
  hira: string
  ko: string
  sort_order: number
}
