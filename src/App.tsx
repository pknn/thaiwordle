import { useEffect, useMemo, useState } from 'react'
import { QuestionMarkCircleIcon, ChartBarIcon } from '@heroicons/react/solid'
import Alert from './components/Alert'
import Grid from './components/Grid'
import Keyboard from './components/Keyboard'
import { HowToPlay, Summary } from './components/Modal'
import { ModalName, ModalState } from './components/Modal/types'
import { Character } from './lib/keyboard/types'
import { isSolution, solution } from './lib/word/guess'
import { thaiLength } from './lib/word/helper'
import { isInWordList } from './lib/word/words'
import {
  loadGameStateFromLocalStorage,
  saveGameStateToLocalStorage,
} from './lib/storage'
import {
  getFinishedGameStatistics,
  getGameStatistics,
  toSharableGameStatistics,
} from './lib/stats/helper'
import { GameStatus } from './lib/status'
import Footer from './components/Footer'

const App = () => {
  const [status, setStatus] = useState<GameStatus>('play')
  const [isLoadedSolution, setIsLoadedSolution] = useState(false)
  const [submittedWords, setSubmittedWords] = useState<string[]>([])
  const [currentWord, setCurrentWord] = useState('')
  const [gameStatistics, setGameStatistics] = useState(getGameStatistics())

  const [shouldShowAlert, setShouldShowAlert] = useState(false)
  const [modalState, setModalState] = useState<ModalState>({
    modal: 'HowToPlay',
    shouldShow: false,
  })

  const [isGodMode, setIsGodMode] = useState(false)

  const shouldShowShareButton = useMemo(() => status !== 'play', [status])

  useEffect(() => {
    const maybeGameState = loadGameStateFromLocalStorage()
    if (!maybeGameState || maybeGameState.solution !== solution.word) {
      setSubmittedWords([])
      setModalState({
        ...modalState,
        shouldShow: true,
      })
    } else {
      const { submittedWords: submittedWordsFromState } = maybeGameState
      setSubmittedWords(submittedWordsFromState)
      setIsLoadedSolution(
        isSolution(
          submittedWordsFromState[submittedWordsFromState.length - 1],
        ) || submittedWordsFromState.length >= 6,
      )
    }
  }, [])

  useEffect(() => {
    const lastSubmittedWord = submittedWords[submittedWords.length - 1]
    if (status !== 'play' || !lastSubmittedWord) return
    if (isSolution(lastSubmittedWord)) {
      setStatus('won')
    } else if (submittedWords.length >= 6) {
      setStatus('lost')
    }
    saveGameStateToLocalStorage({ submittedWords, solution: solution.word })
  }, [submittedWords])

  useEffect(() => {
    if (status === 'play') return
    setGameStatistics(
      getFinishedGameStatistics(
        status,
        submittedWords.length - 1,
        !isLoadedSolution,
      ),
    )
    setModalState({
      modal: 'Summary',
      shouldShow: true,
    })
  }, [status])

  const handlePress = (character: Character) => {
    if (thaiLength(currentWord + character) > 5) return

    setCurrentWord(currentWord + character)
  }

  const handleEnter = () => {
    if (currentWord === 'รักเดฟ') {
      setIsGodMode(true)
    } else if (isInWordList(currentWord)) {
      setSubmittedWords([...submittedWords, currentWord])
    } else {
      setShouldShowAlert(true)
    }
    setCurrentWord('')
  }

  const handleDelete = () => {
    setCurrentWord(currentWord.slice(0, currentWord.length - 1))
  }

  const handleShowModal = (modalName: ModalName) => {
    setModalState({
      modal: modalName,
      shouldShow: true,
    })
  }

  const handleHideModal = () => {
    setModalState({
      ...modalState,
      shouldShow: false,
    })
  }

  const handleShare = () => {
    const content = toSharableGameStatistics(submittedWords)
    if (!!navigator.share)
      navigator.share({
        title: 'ไทยเวิร์ดเดิ้ล',
        text: content,
      })
    navigator.clipboard.writeText(content)
  }

  const modal = useMemo(() => {
    if (!modalState.shouldShow) return
    switch (modalState.modal) {
      case 'HowToPlay':
        return (
          <HowToPlay
            shouldShow={modalState.shouldShow}
            onHide={handleHideModal}
          />
        )
      case 'Summary':
        return (
          <Summary
            shouldShow={modalState.shouldShow}
            submittedWords={submittedWords}
            onHide={handleHideModal}
            gameStatistics={gameStatistics}
            isGameFinished={shouldShowShareButton}
            isLoadedSolution={isLoadedSolution}
            onShare={handleShare}
          />
        )
    }
  }, [modalState])

  return (
    <div className="w-full h-screen">
      {modal}
      <div className="md:container px-4 pt-8 md:px-4 md:max-w-3xl">
        <div className="px-4 flex justify-between items-center">
          <div className="text-xl">ไทยเวิร์ดเดิล</div>
          <div className="flex items-center">
            <button onClick={() => handleShowModal('Summary')}>
              <ChartBarIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button onClick={() => handleShowModal('HowToPlay')}>
              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        {isGodMode && <div className="px-4">คำวันนี้: {solution.word}</div>}
        <div className="relative">
          <Alert
            shouldShow={shouldShowAlert}
            onHide={() => setShouldShowAlert(false)}
          />
          <Grid submittedWords={submittedWords} currentWord={currentWord} />
        </div>
      </div>
      <div className="flex bottom-0 px-4 flex-col">
        <Keyboard
          submittedWords={submittedWords}
          onPress={handlePress}
          onEnter={handleEnter}
          onDelete={handleDelete}
        />
        <Footer />
      </div>
    </div>
  )
}
export default App
