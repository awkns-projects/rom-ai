"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

// Unicorn parts configuration
const unicornParts = {
  bodies: ["body.png", "body_h.png"],
  hair: ["hair_blue.png", "hair_g.png"],
  eyes: ["eye_h.png", "eye_heart.png"],
  mouths: ["m_.png", "m_ice.png"],
  accessories: ["corn_ice1.png", "corn_ice2.png"],
}

interface UnicornParts {
  body: string
  hair: string
  eyes: string
  mouth: string
  accessory: string
}

// Function to generate random unicorn parts
const generateRandomUnicorn = (): UnicornParts => {
  const randomBody = unicornParts.bodies[Math.floor(Math.random() * unicornParts.bodies.length)]
  const randomHair = unicornParts.hair[Math.floor(Math.random() * unicornParts.hair.length)]
  const randomEyes = unicornParts.eyes[Math.floor(Math.random() * unicornParts.eyes.length)]
  const randomMouth = unicornParts.mouths[Math.floor(Math.random() * unicornParts.mouths.length)]
  const randomAccessory = unicornParts.accessories[Math.floor(Math.random() * unicornParts.accessories.length)]

  return {
    body: randomBody,
    hair: randomHair,
    eyes: randomEyes,
    mouth: randomMouth,
    accessory: randomAccessory,
  }
}

interface MatrixBoxProps {
  onUnicornGenerated?: (unicornParts: UnicornParts) => void
}

export default function MatrixBox({ onUnicornGenerated }: MatrixBoxProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [streak, setStreak] = useState(0)

  const handleGenerate = async () => {
    if (isGenerating) return
    
    setIsGenerating(true)
    
    // Add a small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Generate new unicorn
    const newUnicorn = generateRandomUnicorn()
    setStreak(prev => prev + 1)
    
    // Notify parent component
    if (onUnicornGenerated) {
      onUnicornGenerated(newUnicorn)
    }
    
    setIsGenerating(false)
  }

  const handleReset = () => {
    setStreak(0)
  }

  return (
    <div className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
          <span className="text-green-400 text-3xl">🎲</span>
        </div>
        <h3 className="text-lg font-medium text-green-400">Unicorn Generator</h3>
        <p className="text-sm text-gray-400">Click the button below to generate a random unicorn avatar</p>
      </div>

      {/* Streak Counter */}
      {streak > 0 && (
        <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <div className="flex items-center justify-center gap-2">
            <span className="text-yellow-400">🔥</span>
            <span className="text-yellow-400 font-medium">Generation Streak: {streak}</span>
          </div>
        </div>
      )}

      {/* Generation Button */}
      <div className="text-center space-y-4">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-4 h-auto transition-all duration-200 disabled:opacity-50"
          size="lg"
        >
          <span className="mr-3 text-xl">{isGenerating ? '⏳' : '🦄'}</span>
          {isGenerating ? 'Generating...' : 'Generate Random Unicorn'}
        </Button>

        {/* Reset Streak Button */}
        {streak > 0 && (
          <Button
            onClick={handleReset}
            variant="outline"
            className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            size="sm"
          >
            <span className="mr-2">🔄</span>
            Reset Streak
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-900/10 rounded-lg border border-blue-800/50">
        <h5 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
          <span className="text-blue-400">💡</span>
          How it Works
        </h5>
        <div className="text-xs text-blue-300 space-y-1">
          <p>• Click "Generate Random Unicorn" to create a unique avatar</p>
          <p>• Each generation creates a random combination of parts</p>
          <p>• Keep generating until you find one you like!</p>
          <p>• Your generation streak shows how many unicorns you've created</p>
        </div>
      </div>
    </div>
  )
}
