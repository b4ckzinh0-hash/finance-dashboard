'use client'

import { cn } from '@/lib/utils'

const EMOJIS = [
  '🍔','🏠','🚗','📚','🏥','🎮','👗','📋','🛒','📱',
  '🐾','💄','📦','💰','💻','📈','🎁','➕','🎯','🎵',
  '🏋️','💊','🌮','🍕','🎂','🚌','✈️','🏖️','🎪','🎨',
  '🏡','🔑','💡','🎓','🌱','💍','⚽','🎭','🛍️','🐷',
]

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-10 gap-1 rounded-lg border border-zinc-700 bg-zinc-800 p-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded text-lg transition-all hover:bg-zinc-700',
            value === emoji && 'bg-violet-600 ring-1 ring-violet-400',
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
