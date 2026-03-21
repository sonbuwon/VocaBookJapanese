'use client'

import { useState } from 'react'
import type { WordSet, Word, StudyType, AppScreen } from '@/types'
import { getWords } from '@/lib/data-client'
import Header from './Header'
import MenuView from './MenuView'
import SetListView from './SetListView'
import StudyView from './StudyView'

interface AppShellProps {
  initialWordSets: WordSet[]
  initialSentSets: WordSet[]
}

export default function AppShell({ initialWordSets, initialSentSets }: AppShellProps) {
  const [appScreen, setAppScreen] = useState<AppScreen>('menu')
  const [studyType, setStudyType] = useState<StudyType>('word')
  const [currentSetId, setCurrentSetId] = useState<string | null>(null)
  const [currentWords, setCurrentWords] = useState<Word[]>([])
  const [isLoadingWords, setIsLoadingWords] = useState(false)

  const wordSets = initialWordSets
  const sentSets = initialSentSets
  const allSets = [...wordSets, ...sentSets]
  const currentSets = studyType === 'word' ? wordSets : sentSets

  const wordTotal = wordSets.reduce((s, st) => s + (st.word_count ?? 0), 0)
  const sentTotal = sentSets.reduce((s, st) => s + (st.word_count ?? 0), 0)

  const showList = (type: StudyType) => {
    setStudyType(type)
    setAppScreen('list')
  }

  const openSet = async (setId: string) => {
    setIsLoadingWords(true)
    setCurrentSetId(setId)
    try {
      const words = await getWords(setId)
      setCurrentWords(words)
      setAppScreen('study')
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingWords(false)
    }
  }

  const goBack = () => {
    if (appScreen === 'study') setAppScreen('list')
    else setAppScreen('menu')
  }

  const headerTitle = () => {
    if (appScreen === 'menu') return '일본어 단어장'
    if (appScreen === 'list') return studyType === 'word' ? '단어 세트' : '문장 세트'
    const set = allSets.find(s => s.id === currentSetId)
    return set?.name ?? '학습'
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Header title={headerTitle()} showBack={appScreen !== 'menu'} onBack={goBack} />

      {appScreen === 'menu' && (
        <MenuView
          wordSetCount={wordSets.length}
          wordCount={wordTotal}
          sentSetCount={sentSets.length}
          sentCount={sentTotal}
          onSelect={showList}
        />
      )}

      {appScreen === 'list' && (
        <SetListView
          sets={currentSets}
          studyType={studyType}
          onSelect={openSet}
        />
      )}

      {appScreen === 'study' && (
        isLoadingWords ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
            로딩 중...
          </div>
        ) : (
          <StudyView words={currentWords} studyType={studyType} />
        )
      )}
    </div>
  )
}
