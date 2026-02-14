'use client'

import { useState, useEffect } from 'react'
import { EducationalModule, ModuleProgress, Kid } from '@/lib/types/database'
import { getSkillEmoji, getSkillName } from '@/lib/utils/skills'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import confetti from 'canvas-confetti'

interface Props {
  module: EducationalModule
  progress: ModuleProgress | null
  kid: Kid
  familyId: string
  onClose: () => void
  onComplete: () => void
}

interface Lesson {
  title: string
  content: string
  type?: 'text' | 'video' | 'quiz'
  quiz?: {
    question: string
    options: string[]
    correctAnswer: number
  }
}

export default function ModulePlayer({ module, progress, kid, familyId, onClose, onComplete }: Props) {
  const [currentLesson, setCurrentLesson] = useState(progress?.current_lesson || 0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [quizScore, setQuizScore] = useState(progress?.quiz_score || 0)

  // Parse module content (JSONB)
  const lessons: Lesson[] = module.content?.lessons || [
    {
      title: 'Introduction',
      content: module.description || 'Welcome to this learning module!',
      type: 'text'
    }
  ]

  const totalLessons = lessons.length
  const currentLessonData = lessons[currentLesson]
  const progressPercent = Math.round((currentLesson / totalLessons) * 100)

  const saveProgress = async (lessonIndex: number, percent: number, completed: boolean = false) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      if (progress) {
        // Update existing progress
        await supabase
          .from('module_progress')
          .update({
            current_lesson: lessonIndex,
            progress_percent: percent,
            last_accessed_at: new Date().toISOString(),
            ...(completed && { completed_at: new Date().toISOString() }),
            quiz_score: quizScore,
          })
          .eq('id', progress.id)
      } else {
        // Create new progress
        await supabase
          .from('module_progress')
          .insert({
            module_id: module.id,
            kid_id: kid.id,
            family_id: familyId,
            current_lesson: lessonIndex,
            progress_percent: percent,
            ...(completed && { completed_at: new Date().toISOString() }),
            quiz_score: quizScore,
          })
      }
    } catch (err) {
      console.error('Failed to save progress:', err)
    }
  }

  const handleNext = async () => {
    if (currentLesson < totalLessons - 1) {
      const nextLesson = currentLesson + 1
      setCurrentLesson(nextLesson)
      const newPercent = Math.round((nextLesson / totalLessons) * 100)
      await saveProgress(nextLesson, newPercent)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      // Complete the module
      await completeModule()
    }
  }

  const handlePrevious = () => {
    if (currentLesson > 0) {
      const prevLesson = currentLesson - 1
      setCurrentLesson(prevLesson)
      const newPercent = Math.round((prevLesson / totalLessons) * 100)
      saveProgress(prevLesson, newPercent)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const handleQuizAnswer = () => {
    if (selectedAnswer === null) return
    
    setShowResult(true)
    
    const isCorrect = selectedAnswer === currentLessonData.quiz?.correctAnswer
    if (isCorrect) {
      setQuizScore(quizScore + 10)
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      })
    }
  }

  const completeModule = async () => {
    setIsCompleting(true)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Mark module as complete
      await saveProgress(totalLessons - 1, 100, true)

      // Award points if this is first completion
      if (!progress || progress.progress_percent < 100) {
        await supabase.rpc('award_module_completion_points', {
          kid_uuid: kid.id,
          module_uuid: module.id,
          points: module.points_reward
        })

        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }

      onComplete()
    } catch (err) {
      console.error('Failed to complete module:', err)
      alert('Failed to save completion. Please try again.')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {module.icon && <span className="text-3xl">{module.icon}</span>}
                <h2 className="text-2xl font-bold text-white">
                  {module.title}
                </h2>
              </div>
              {module.skill_type && module.skill_type !== 'general' && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <span>{getSkillEmoji(module.skill_type)}</span>
                  <span>{getSkillName(module.skill_type)}</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-white/60 mb-2">
              <span>Lesson {currentLesson + 1} of {totalLessons}</span>
              <span>{progressPercent}% complete</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: `${progressPercent}%` }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              />
            </div>
          </div>

          {/* Lesson Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLesson}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-8"
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                {currentLessonData.title}
              </h3>

              {currentLessonData.type === 'quiz' && currentLessonData.quiz ? (
                <div className="space-y-4">
                  <p className="text-white/80 text-lg mb-4">
                    {currentLessonData.quiz.question}
                  </p>
                  <div className="space-y-3">
                    {currentLessonData.quiz.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => !showResult && setSelectedAnswer(index)}
                        disabled={showResult}
                        className={`w-full p-4 rounded-lg text-left transition-all ${
                          showResult
                            ? index === currentLessonData.quiz!.correctAnswer
                              ? 'bg-green-500/20 border-2 border-green-500'
                              : index === selectedAnswer
                              ? 'bg-red-500/20 border-2 border-red-500'
                              : 'bg-white/5 border border-white/10'
                            : selectedAnswer === index
                            ? 'bg-purple-500/20 border-2 border-purple-500'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            showResult
                              ? index === currentLessonData.quiz!.correctAnswer
                                ? 'border-green-500 bg-green-500'
                                : index === selectedAnswer
                                ? 'border-red-500 bg-red-500'
                                : 'border-white/30'
                              : selectedAnswer === index
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-white/30'
                          }`}>
                            {showResult && index === currentLessonData.quiz!.correctAnswer && (
                              <span className="text-white text-sm">✓</span>
                            )}
                            {showResult && index === selectedAnswer && index !== currentLessonData.quiz!.correctAnswer && (
                              <span className="text-white text-sm">✗</span>
                            )}
                          </div>
                          <span className="text-white">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {!showResult && selectedAnswer !== null && (
                    <Button variant="primary" onClick={handleQuizAnswer} className="w-full">
                      Submit Answer
                    </Button>
                  )}
                  
                  {showResult && (
                    <div className={`p-4 rounded-lg ${
                      selectedAnswer === currentLessonData.quiz.correctAnswer
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <p className={`font-semibold ${
                        selectedAnswer === currentLessonData.quiz.correctAnswer
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {selectedAnswer === currentLessonData.quiz.correctAnswer
                          ? '✓ Correct! Great job!'
                          : '✗ Not quite. Try to learn from this!'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <p className="text-white/80 text-lg whitespace-pre-wrap leading-relaxed">
                    {currentLessonData.content}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentLesson === 0}
            >
              ← Previous
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-white/60">Quiz Score</div>
              <div className="text-xl font-bold gradient-text">{quizScore} pts</div>
            </div>
            
            {currentLesson === totalLessons - 1 ? (
              <Button
                variant="primary"
                onClick={completeModule}
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : 
                  progress?.progress_percent === 100 ? 'Close' : `Complete (+${module.points_reward} pts) →`}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={currentLessonData.type === 'quiz' && !showResult}
              >
                Next →
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
