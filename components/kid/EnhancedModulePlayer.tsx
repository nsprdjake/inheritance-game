'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface Lesson {
  id: string
  title: string
  content: string
  type: 'text' | 'quiz' | 'video'
  quizOptions?: string[]
  correctAnswer?: number
}

interface Module {
  id: string
  title: string
  description: string
  icon: string
  lessons: Lesson[]
  xpReward: number
}

interface Props {
  module: Module
  onComplete: () => void
  onClose: () => void
}

export default function EnhancedModulePlayer({ module, onComplete, onClose }: Props) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  
  const currentLesson = module.lessons[currentLessonIndex]
  const progress = ((currentLessonIndex + 1) / module.lessons.length) * 100
  const isLastLesson = currentLessonIndex === module.lessons.length - 1
  
  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index)
  }
  
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    
    setShowFeedback(true)
    
    if (selectedAnswer === currentLesson.correctAnswer) {
      // Correct answer celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ADE80', '#FFD700', '#38BDF8']
      })
      
      // Mark as completed
      const newCompleted = new Set(completedLessons)
      newCompleted.add(currentLesson.id)
      setCompletedLessons(newCompleted)
      
      // Auto advance after delay
      setTimeout(() => {
        handleNext()
      }, 2000)
    }
  }
  
  const handleNext = () => {
    if (isLastLesson) {
      // Module complete!
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FF6B9D', '#C23AFF', '#4F46E5', '#FFD700', '#4ADE80']
      })
      
      setTimeout(() => {
        onComplete()
      }, 1000)
    } else {
      setCurrentLessonIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    }
  }
  
  const isCorrect = selectedAnswer === currentLesson.correctAnswer
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-white/20 shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="text-5xl"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {module.icon}
              </motion.div>
              
              <div>
                <h2 className="text-2xl font-black text-white mb-1">
                  {module.title}
                </h2>
                <p className="text-white/60 text-sm">
                  Lesson {currentLessonIndex + 1} of {module.lessons.length}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            </motion.div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLessonIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Lesson Title */}
              <h3 className="text-3xl font-black text-white mb-6">
                {currentLesson.title}
              </h3>
              
              {/* Lesson Content */}
              {currentLesson.type === 'text' && (
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-white/80 leading-relaxed">
                    {currentLesson.content}
                  </p>
                </div>
              )}
              
              {currentLesson.type === 'quiz' && (
                <div>
                  <p className="text-lg text-white/80 mb-6 leading-relaxed">
                    {currentLesson.content}
                  </p>
                  
                  {/* Quiz Options */}
                  <div className="space-y-4">
                    {currentLesson.quizOptions?.map((option, index) => (
                      <motion.button
                        key={index}
                        onClick={() => !showFeedback && handleAnswerSelect(index)}
                        disabled={showFeedback}
                        whileHover={!showFeedback ? { scale: 1.02 } : {}}
                        whileTap={!showFeedback ? { scale: 0.98 } : {}}
                        className={`w-full p-6 rounded-2xl border-2 text-left font-semibold text-lg transition-all ${
                          showFeedback
                            ? index === currentLesson.correctAnswer
                              ? 'bg-green-500/20 border-green-400 text-green-400'
                              : selectedAnswer === index
                              ? 'bg-red-500/20 border-red-400 text-red-400'
                              : 'bg-white/5 border-white/20 text-white/50'
                            : selectedAnswer === index
                            ? 'bg-purple-500/20 border-purple-400 text-white'
                            : 'bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showFeedback && (
                            <span className="text-2xl">
                              {index === currentLesson.correctAnswer ? '✅' : selectedAnswer === index ? '❌' : ''}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  
                  {/* Feedback */}
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-6 p-6 rounded-2xl ${
                        isCorrect
                          ? 'bg-green-500/20 border-2 border-green-400'
                          : 'bg-red-500/20 border-2 border-red-400'
                      }`}
                    >
                      <p className={`text-lg font-bold mb-2 ${
                        isCorrect ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isCorrect ? '🎉 Correct!' : '❌ Not quite!'}
                      </p>
                      <p className="text-white/80">
                        {isCorrect
                          ? 'Great job! Keep going! 🚀'
                          : 'The correct answer is highlighted above. Learn and try again!'
                        }
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-white/60 text-sm">
              {completedLessons.size} of {module.lessons.length} completed
            </div>
            
            <div className="flex gap-3">
              {currentLesson.type === 'quiz' && !showFeedback && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-shadow"
                >
                  Submit Answer
                </motion.button>
              )}
              
              {(currentLesson.type === 'text' || (showFeedback && isCorrect)) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-shadow"
                >
                  {isLastLesson ? '🎉 Complete Module' : 'Next Lesson →'}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
