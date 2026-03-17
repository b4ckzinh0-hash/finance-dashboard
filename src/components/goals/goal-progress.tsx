'use client'

import { motion } from 'framer-motion'

interface GoalProgressProps {
  current: number
  target: number
  color: string
  animated?: boolean
}

export default function GoalProgress({ current, target, color, animated = false }: GoalProgressProps) {
  const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{percentage.toFixed(1)}%</span>
        <span>{percentage >= 100 ? '✅ Concluída' : `Faltam ${(100 - percentage).toFixed(1)}%`}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        {animated ? (
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ) : (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        )}
      </div>
    </div>
  )
}
