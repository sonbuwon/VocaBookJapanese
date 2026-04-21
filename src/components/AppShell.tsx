'use client'

import { useState, useEffect } from 'react'
import type { WordSet, Word, StudyType, AppScreen, DialogSetData } from '@/types'
import { getWords } from '@/lib/data-client'
import { getDialogSetData } from '@/lib/data-client'
import { FAVORITES_SET_ID, getFavoritesCount, getFavoriteWords } from '@/lib/favorites-client'
import { useInactivityLogout } from '@/lib/useInactivityLogout'
import Header from './Header'
import MenuView from './MenuView'
import SetListView from './SetListView'
import StudyView from './StudyView'
import DialogSetListView from './DialogSetListView'
import DialogStudyView from './DialogStudyView'
import QuizView from './QuizView'

interface AppShellProps {
  initialDefaultWordSets: WordSet[]
  initialPersonalWordSets: WordSet[]
  initialDefaultSentSets: WordSet[]
  initialPersonalSentSets: WordSet[]
  initialDialogSets: WordSet[]
  userEmail: string
  isAdmin: boolean
}

export default function AppShell({
  initialDefaultWordSets,
  initialPersonalWordSets,
  initialDefaultSentSets,
  initialPersonalSentSets,
  initialDialogSets,
  userEmail,
  isAdmin,
}: AppShellProps) {
  useInactivityLogout()

  const [appScreen, setAppScreen] = useState<AppScreen>('menu')
  const [studyType, setStudyType] = useState<StudyType>('word')
  const [currentSetId, setCurrentSetId] = useState<string | null>(null)
  const [currentWords, setCurrentWords] = useState<Word[]>([])
  const [currentDialogData, setCurrentDialogData] = useState<DialogSetData | null>(null)
  const [isLoadingWords, setIsLoadingWords] = useState(false)
  const [favCounts, setFavCounts] = useState<{ word: number; sent: number }>({ word: 0, sent: 0 })

  const defaultWordSets = initialDefaultWordSets
  const personalWordSets = initialPersonalWordSets
  const defaultSentSets = initialDefaultSentSets
  const personalSentSets = initialPersonalSentSets
  const dialogSets = initialDialogSets

  const allSets = [
    ...defaultWordSets, ...personalWordSets,
    ...defaultSentSets, ...personalSentSets,
    ...dialogSets,
  ]

  const currentDefaultSets = studyType === 'word' ? defaultWordSets : defaultSentSets
  const currentPersonalSets = studyType === 'word' ? personalWordSets : personalSentSets

  const wordSetCount = defaultWordSets.length + personalWordSets.length
  const sentSetCount = defaultSentSets.length + personalSentSets.length
  const wordTotal = [...defaultWordSets, ...personalWordSets].reduce((s, st) => s + (st.word_count ?? 0), 0)
  const sentTotal = [...defaultSentSets, ...personalSentSets].reduce((s, st) => s + (st.word_count ?? 0), 0)

  // 리스트 화면으로 전환될 때마다 즐겨찾기 수 갱신
  useEffect(() => {
    if (appScreen !== 'list') return
    if (studyType === 'dialog') return
    getFavoritesCount(studyType).then(count =>
      setFavCounts(prev => ({ ...prev, [studyType]: count }))
    )
  }, [appScreen, studyType])

  const showList = (type: StudyType) => {
    setStudyType(type)
    setAppScreen('list')
  }

  const openSet = async (setId: string) => {
    setIsLoadingWords(true)
    setCurrentSetId(setId)
    try {
      if (studyType === 'dialog') {
        const data = await getDialogSetData(setId)
        setCurrentDialogData(data)
      } else {
        const words = setId === FAVORITES_SET_ID
          ? await getFavoriteWords(studyType)
          : await getWords(setId)
        setCurrentWords(words)
      }
      setAppScreen('study')
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingWords(false)
    }
  }

  const goBack = () => {
    if (appScreen === 'study') {
      setAppScreen('list')
    } else {
      setAppScreen('menu')
    }
  }

  const headerTitle = () => {
    if (appScreen === 'menu') return '일본어 단어장'
    if (appScreen === 'quiz') return '퀴즈'
    if (appScreen === 'list') {
      if (studyType === 'word') return '단어 세트'
      if (studyType === 'sent') return '문장 세트'
      return '대화 스크립트'
    }
    if (currentSetId === FAVORITES_SET_ID) return '★ 즐겨찾기'
    const set = allSets.find(s => s.id === currentSetId)
    return set?.name ?? '학습'
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Header
        title={headerTitle()}
        showBack={appScreen !== 'menu'}
        onBack={goBack}
        showLogout={appScreen === 'menu'}
        showHome={appScreen !== 'menu'}
        onHome={() => setAppScreen('menu')}
      />

      {appScreen === 'menu' && (
        <MenuView
          wordSetCount={wordSetCount}
          wordCount={wordTotal}
          sentSetCount={sentSetCount}
          sentCount={sentTotal}
          dialogSetCount={dialogSets.length}
          onSelect={showList}
          onQuiz={() => setAppScreen('quiz')}
          isAdmin={isAdmin}
        />
      )}

      {appScreen === 'list' && studyType !== 'dialog' && (
        <SetListView
          defaultSets={currentDefaultSets}
          personalSets={currentPersonalSets}
          studyType={studyType}
          favoritesCount={favCounts[studyType as 'word' | 'sent']}
          onSelect={openSet}
          onFavoritesCleared={() => setFavCounts(prev => ({ ...prev, [studyType]: 0 }))}
        />
      )}

      {appScreen === 'quiz' && (
        <QuizView wordSets={[...defaultWordSets, ...personalWordSets]} />
      )}

      {appScreen === 'list' && studyType === 'dialog' && (
        <DialogSetListView
          sets={dialogSets}
          onSelect={openSet}
        />
      )}

      {appScreen === 'study' && (
        isLoadingWords ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
            로딩 중...
          </div>
        ) : studyType === 'dialog' ? (
          currentDialogData && <DialogStudyView data={currentDialogData} />
        ) : (
          <StudyView words={currentWords} studyType={studyType} />
        )
      )}
    </div>
  )
}
