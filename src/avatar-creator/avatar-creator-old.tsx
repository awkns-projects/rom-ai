"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type AvatarType = "rom-unicorn" | "custom"
type RomUnicornType = "default" | "random"
type CustomType = "upload" | "wallet"

interface UnicornParts {
  body: string
  hair: string
  eyes: string
  mouth: string
  accessory: string
}

interface AvatarData {
  accessToken?: string
  isAuthenticated?: boolean
  shopifyStore?: string
  name: string
  personality?: string
  characterNames?: string
  type: AvatarType
  romUnicornType?: RomUnicornType
  customType?: CustomType
  uploadedImage?: string
  selectedStyle?: string
  connectedWallet?: string
  selectedNFT?: string
  unicornParts?: UnicornParts
}

const artStyles = [
  { id: "ghibli", name: "Studio Ghibli", description: "Magical anime style" },
  { id: "dragonball", name: "Dragon Ball", description: "Bold anime style" },
  { id: "pixar", name: "Pixar 3D", description: "Colorful 3D style" },
  { id: "disney", name: "Disney Classic", description: "Classic animation" },
  { id: "manga", name: "Manga", description: "Black & white comic" },
  { id: "cyberpunk", name: "Cyberpunk", description: "Futuristic neon" },
  { id: "watercolor", name: "Watercolor", description: "Artistic painting" },
  { id: "cartoon", name: "Cartoon", description: "Fun cartoon style" },
]

const facialExpressions = [
  { emoji: "😊", name: "Happy", description: "Joyful smile" },
  { emoji: "😎", name: "Cool", description: "Confident look" },
  { emoji: "🤔", name: "Thoughtful", description: "Contemplative" },
  { emoji: "😴", name: "Sleepy", description: "Relaxed" },
  { emoji: "😮", name: "Surprised", description: "Wide-eyed" },
  { emoji: "😤", name: "Determined", description: "Focused" },
  { emoji: "🥰", name: "Loving", description: "Affectionate" },
  { emoji: "😏", name: "Smirk", description: "Playful" },
]

// Unicorn parts configuration
const unicornParts = {
  bodies: ["body.png", "body_h.png"],
  hair: ["hair_blue.png", "hair_g.png"],
  eyes: ["eye_h.png", "eye_heart.png"],
  mouths: ["m_.png", "m_ice.png"],
  accessories: ["corn_ice1.png", "corn_ice2.png"],
}

// Composite Unicorn Component
const CompositeUnicorn: React.FC<{ parts: UnicornParts; size?: number }> = ({ parts, size = 128 }) => {
  // Map the part names to their actual file paths
  const getImageSrc = (category: string, filename: string) => {
    // Direct mapping to the public folder files
    const imageMap: { [key: string]: { [key: string]: string } } = {
      bodies: {
        "body.png": "/images/unicorn/bodies/body.png",
        "body_h.png": "/images/unicorn/bodies/body_h.png",
      },
      hair: {
        "hair_blue.png": "/images/unicorn/hair/hair_blue.png",
        "hair_g.png": "/images/unicorn/hair/hair_g.png",
      },
      eyes: {
        "eye_h.png": "/images/unicorn/eyes/eye_h.png",
        "eye_heart.png": "/images/unicorn/eyes/eye_heart.png",
      },
      mouths: {
        "m_.png": "/images/unicorn/mouths/m_.png",
        "m_ice.png": "/images/unicorn/mouths/m_ice.png",
      },
      accessories: {
        "corn_ice1.png": "/images/unicorn/accessories/corn_ice1.png",
        "corn_ice2.png": "/images/unicorn/accessories/corn_ice2.png",
      },
    }
    return imageMap[category]?.[filename] || `/placeholder.svg?height=${size}&width=${size}`
  }

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* Body (base layer) */}
      <Image
        src={getImageSrc("bodies", parts.body) || "/placeholder.svg"}
        alt="Unicorn body"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 1 }}
      />

      {/* Hair */}
      <Image
        src={getImageSrc("hair", parts.hair) || "/placeholder.svg"}
        alt="Unicorn hair"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 2 }}
      />

      {/* Eyes */}
      <Image
        src={getImageSrc("eyes", parts.eyes) || "/placeholder.svg"}
        alt="Unicorn eyes"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 3 }}
      />

      {/* Mouth */}
      <Image
        src={getImageSrc("mouths", parts.mouth) || "/placeholder.svg"}
        alt="Unicorn mouth"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 4 }}
      />

      {/* Accessory (top layer) */}
      <Image
        src={getImageSrc("accessories", parts.accessory) || "/placeholder.svg"}
        alt="Unicorn accessory"
        width={size}
        height={size}
        className="absolute inset-0 object-contain"
        style={{ zIndex: 5 }}
      />
    </div>
  )
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

export default function AvatarCreator() {
  const [step, setStep] = useState(1)
  const [avatarData, setAvatarData] = useState<AvatarData>({
    isAuthenticated: false,
    name: "",
    type: "rom-unicorn",
    romUnicornType: "default",
    customType: "upload",
  })

  const [isCreating, setIsCreating] = useState(false)
  const [creationProgress, setCreationProgress] = useState(0)
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([])
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Auto-save functionality
  const saveToLocalStorage = useCallback((data: AvatarData, currentStep: number) => {
    try {
      const saveData = {
        avatarData: data,
        step: currentStep,
        timestamp: new Date().toISOString(),
        version: "1.0",
      }
      localStorage.setItem("avatar-creator-progress", JSON.stringify(saveData))
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Failed to save progress:", error)
    }
  }, [])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("avatar-creator-progress")
      if (saved) {
        const { avatarData: savedData, step: savedStep, timestamp } = JSON.parse(saved)
        setAvatarData(savedData)
        setStep(savedStep)
        setLastSaved(new Date(timestamp))
        console.log("Restored previous session from", timestamp)
      }
    } catch (error) {
      console.error("Failed to load saved progress:", error)
    }
  }, [])

  // Auto-save when data changes
  useEffect(() => {
    if (lastSaved !== null) {
      // Don't save on initial load
      const timeoutId = setTimeout(() => {
        saveToLocalStorage(avatarData, step)
      }, 1000) // Debounce saves by 1 second

      setHasUnsavedChanges(true)
      return () => clearTimeout(timeoutId)
    }
  }, [avatarData, step, saveToLocalStorage, lastSaved])

  const clearSavedData = () => {
    localStorage.removeItem("avatar-creator-progress")
    setLastSaved(null)
    setHasUnsavedChanges(false)
    // Reset to initial state
    setAvatarData({
      isAuthenticated: false,
      name: "",
      type: "rom-unicorn",
      romUnicornType: "default",
      customType: "upload",
    })
    setStep(1)
    setGeneratedVariations([])
    setCreationProgress(0)
    setIsCreating(false)
  }

  const handleNameChange = (name: string) => {
    setAvatarData((prev) => ({ ...prev, name }))
  }

  const handleTypeChange = (type: AvatarType) => {
    setAvatarData((prev) => ({ ...prev, type }))
  }

  const handleRomUnicornTypeChange = (romUnicornType: RomUnicornType) => {
    setAvatarData((prev) => ({ ...prev, romUnicornType }))
  }

  const handleCustomTypeChange = (customType: CustomType) => {
    setAvatarData((prev) => ({ ...prev, customType }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarData((prev) => ({ ...prev, uploadedImage: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStyleSelect = (styleId: string) => {
    setAvatarData((prev) => ({ ...prev, selectedStyle: styleId }))
  }

  const handleAccessTokenChange = (token: string) => {
    setAvatarData((prev) => ({ ...prev, accessToken: token }))
  }

  const handleShopifyLogin = async () => {
    console.log("Initiating Shopify OAuth...")
    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setAvatarData((prev) => ({
      ...prev,
      isAuthenticated: true,
      shopifyStore: "my-store.myshopify.com",
      accessToken: "shpat_" + Math.random().toString(36).substring(2, 15),
    }))
  }

  const handleTokenSubmit = () => {
    if (avatarData.accessToken && avatarData.accessToken.length > 10) {
      setAvatarData((prev) => ({ ...prev, isAuthenticated: true }))
    }
  }

  const handleLogout = () => {
    setAvatarData((prev) => ({
      ...prev,
      isAuthenticated: false,
      accessToken: undefined,
      shopifyStore: undefined,
    }))
  }

  const handlePersonalityChange = (personality: string) => {
    setAvatarData((prev) => ({ ...prev, personality }))
  }

  const handleCharacterNamesChange = (characterNames: string) => {
    setAvatarData((prev) => ({ ...prev, characterNames }))
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const handleGenerateRandomUnicorn = () => {
    const randomParts = generateRandomUnicorn()
    setAvatarData((prev) => ({ ...prev, unicornParts: randomParts }))
  }

  const connectWallet = async () => {
    console.log("Connecting to wallet...")
    setAvatarData((prev) => ({ ...prev, connectedWallet: "0x1234...5678" }))
  }

  const selectNFT = (nftId: string) => {
    setAvatarData((prev) => ({ ...prev, selectedNFT: nftId }))
  }

  const createAvatar = async () => {
    console.log("Creating avatar with data:", avatarData)
    setIsCreating(true)
    setCreationProgress(0)
    setGeneratedVariations([])

    // Simulate AI generation process
    for (let i = 0; i < facialExpressions.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setCreationProgress(((i + 1) / facialExpressions.length) * 100)
      setGeneratedVariations((prev) => [...prev, facialExpressions[i].emoji])
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsCreating(false)
  }

  // Updated step titles with new order
  const stepTitles = ["Choose Source", "Name Your Avatar", "Connect Store", "Generate & Review"]

  const getSelectedStyle = () => {
    return artStyles.find((style) => style.id === avatarData.selectedStyle)
  }

  const renderAvatarPreview = (size = 128) => {
    if (avatarData.type === "rom-unicorn" && avatarData.unicornParts) {
      return <CompositeUnicorn parts={avatarData.unicornParts} size={size} />
    } else if (avatarData.type === "custom" && avatarData.customType === "upload" && avatarData.uploadedImage) {
      return (
        <Image
          src={avatarData.uploadedImage || "/placeholder.svg"}
          alt="Avatar preview"
          width={size}
          height={size}
          className="rounded-lg object-cover"
        />
      )
    } else if (avatarData.type === "custom" && avatarData.customType === "wallet" && avatarData.selectedNFT) {
      return <span className="text-4xl">{avatarData.selectedNFT.split(" ")[0]}</span>
    } else {
      return <span className="text-4xl text-gray-400">🦄</span>
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-3 sm:p-6 font-mono">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🎨</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-green-400">Avatar Creator</h1>
                <p className="text-xs sm:text-sm text-gray-400">Design and configure your AI agent avatar</p>
              </div>
            </div>

            {/* Save Status & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {lastSaved && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <div
                          className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? "bg-yellow-500" : "bg-green-500"}`}
                        ></div>
                        <span className="hidden sm:inline">{hasUnsavedChanges ? "Saving..." : "Saved"}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last saved: {lastSaved.toLocaleTimeString()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {lastSaved && (
                <Button
                  onClick={clearSavedData}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 text-xs h-7"
                >
                  Clear Progress
                </Button>
              )}
            </div>
          </div>

          {/* Progress restoration notice */}
          {lastSaved && step > 1 && (
            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/50 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500/20 rounded flex items-center justify-center">
                  <span className="text-blue-400 text-xs">↻</span>
                </div>
                <p className="text-xs text-blue-400">
                  Progress restored from {lastSaved.toLocaleDateString()} at {lastSaved.toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-200 ${
                      i <= step ? "bg-green-500 text-white" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {i <= step ? "✓" : i}
                  </div>
                  <span
                    className={`ml-2 sm:ml-3 text-xs sm:text-sm transition-colors duration-200 ${
                      i <= step ? "text-green-400" : "text-gray-500"
                    } hidden sm:inline`}
                  >
                    {stepTitles[i - 1]}
                  </span>
                </div>
                {i < 4 && (
                  <div className="flex-1 mx-2 sm:mx-4">
                    <div className={`h-px transition-all duration-300 ${i < step ? "bg-green-500" : "bg-gray-800"}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Mobile step titles */}
          <div className="mt-2 text-center sm:hidden">
            <span className="text-xs text-green-400">{stepTitles[step - 1]}</span>
          </div>
        </div>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="border-b border-gray-800 bg-gray-900/30 p-4 sm:p-6">
            <CardTitle className="text-green-400 text-base sm:text-lg font-medium flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500/20 rounded flex items-center justify-center">
                <span className="text-green-400 text-xs sm:text-sm">
                  {step === 1 && "🎨"}
                  {step === 2 && "⚙️"}
                  {step === 3 && "🔐"}
                  {step === 4 && "✨"}
                </span>
              </div>
              {stepTitles[step - 1]}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Step 1: Choose Source (previously Step 3) */}
            {step === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <RadioGroup value={avatarData.type} onValueChange={handleTypeChange}>
                  <div className="grid gap-3 sm:gap-4">
                    {/* Rom Unicorn Option */}
                    <Label htmlFor="rom-unicorn" className="cursor-pointer">
                      <Card
                        className={`p-3 sm:p-4 transition-all duration-150 border hover:scale-[1.01] ${
                          avatarData.type === "rom-unicorn"
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="rom-unicorn" id="rom-unicorn" className="border-green-500" />
                          <div className="flex-1">
                            <h3 className="font-medium text-sm sm:text-base text-gray-100 flex items-center gap-2">
                              Template Avatar
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center cursor-help">
                                      <span className="text-xs text-gray-300">?</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Pre-designed unicorn avatars with customizable parts</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">Ready-to-use unicorn designs</p>
                          </div>
                        </div>
                      </Card>
                    </Label>

                    {/* Custom Option */}
                    <Label htmlFor="custom" className="cursor-pointer">
                      <Card
                        className={`p-3 sm:p-4 transition-all duration-150 border hover:scale-[1.01] ${
                          avatarData.type === "custom"
                            ? "border-green-500 bg-green-500/10"
                            : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="custom" id="custom" className="border-green-500" />
                          <div className="flex-1">
                            <h3 className="font-medium text-sm sm:text-base text-gray-100">Custom</h3>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">Upload image or connect wallet</p>
                          </div>
                        </div>
                      </Card>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Rom Unicorn Sub-options */}
                {avatarData.type === "rom-unicorn" && (
                  <div className="p-3 sm:p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <h4 className="font-medium mb-3 text-sm sm:text-base text-gray-300">Template Type</h4>
                    <RadioGroup value={avatarData.romUnicornType} onValueChange={handleRomUnicornTypeChange}>
                      <div className="space-y-2 sm:space-y-3">
                        <Label
                          htmlFor="default"
                          className="flex items-center space-x-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-150"
                        >
                          <RadioGroupItem value="default" id="default" className="border-green-500" />
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-green-400 text-sm sm:text-base">⚡</span>
                            </div>
                            <div>
                              <span className="font-medium text-sm sm:text-base text-gray-100">Classic Design</span>
                              <p className="text-xs sm:text-sm text-gray-400">Our signature unicorn look</p>
                            </div>
                          </div>
                        </Label>

                        <Label
                          htmlFor="random"
                          className="flex items-center space-x-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-150"
                        >
                          <RadioGroupItem value="random" id="random" className="border-green-500" />
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-blue-400 text-sm sm:text-base">🎲</span>
                            </div>
                            <div>
                              <span className="font-medium text-sm sm:text-base text-gray-100">Surprise Me</span>
                              <p className="text-xs sm:text-sm text-gray-400">Randomly mixed parts</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {avatarData.romUnicornType === "random" && (
                      <div className="mt-3 sm:mt-4">
                        <Button
                          onClick={handleGenerateRandomUnicorn}
                          className="bg-green-500 hover:bg-green-600 text-white transition-all duration-150 text-sm sm:text-base h-9 sm:h-auto"
                        >
                          <span className="mr-2">🎲</span>
                          Generate Random
                        </Button>
                      </div>
                    )}

                    {/* Unicorn Preview */}
                    {avatarData.unicornParts && (
                      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <h5 className="font-medium mb-3 text-sm sm:text-base text-gray-300 text-center">Preview</h5>
                        <div className="flex justify-center">
                          <CompositeUnicorn parts={avatarData.unicornParts} size={96} />
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-xs text-gray-400">
                            {avatarData.romUnicornType === "default" ? "Default Template" : "Random Template"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Options */}
                {avatarData.type === "custom" && (
                  <div className="p-3 sm:p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <h4 className="font-medium mb-3 text-sm sm:text-base text-gray-300">Source Type</h4>
                    <RadioGroup value={avatarData.customType} onValueChange={handleCustomTypeChange}>
                      <div className="space-y-2 sm:space-y-3">
                        <Label
                          htmlFor="upload"
                          className="flex items-center space-x-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-150"
                        >
                          <RadioGroupItem value="upload" id="upload" className="border-green-500" />
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-blue-400 text-sm sm:text-base">📤</span>
                            </div>
                            <div>
                              <span className="font-medium text-sm sm:text-base text-gray-100">Upload Image</span>
                              <p className="text-xs sm:text-sm text-gray-400">Upload custom image file</p>
                            </div>
                          </div>
                        </Label>

                        <Label
                          htmlFor="wallet"
                          className="flex items-center space-x-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-150"
                        >
                          <RadioGroupItem value="wallet" id="wallet" className="border-green-500" />
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-orange-400 text-sm sm:text-base">🔗</span>
                            </div>
                            <div>
                              <span className="font-medium text-sm sm:text-base text-gray-100">Connect Wallet</span>
                              <p className="text-xs sm:text-sm text-gray-400">Use NFT from wallet</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Upload Section */}
                    {avatarData.customType === "upload" && (
                      <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6 text-center bg-gray-800/20 hover:border-gray-500 hover:bg-gray-800/30 transition-all duration-200">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <Label htmlFor="file-upload" className="cursor-pointer">
                            <div className="text-xl sm:text-2xl mb-2 text-gray-400">📤</div>
                            <p className="text-sm sm:text-base text-gray-300 font-medium">Click to upload image</p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                          </Label>
                        </div>

                        {avatarData.uploadedImage && (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="text-center">
                              <div className="relative inline-block">
                                <Image
                                  src={avatarData.uploadedImage || "/placeholder.svg"}
                                  alt="Uploaded avatar"
                                  width={80}
                                  height={80}
                                  className="sm:w-[100px] sm:h-[100px] rounded-lg object-cover border border-gray-600"
                                />
                                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-green-400 mt-2 font-medium">Upload successful</p>
                            </div>

                            {/* Style Selection */}
                            <div className="p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                              <h5 className="font-medium mb-3 text-sm sm:text-base text-gray-300">Art Style</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                                {artStyles.map((style) => (
                                  <div
                                    key={style.id}
                                    onClick={() => handleStyleSelect(style.id)}
                                    className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-150 border text-center hover:scale-[1.01] ${
                                      avatarData.selectedStyle === style.id
                                        ? "border-green-500 bg-green-500/10"
                                        : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                                    }`}
                                  >
                                    <p className="text-xs sm:text-sm font-medium text-gray-100">{style.name}</p>
                                    <p className="text-xs text-gray-400 mt-1 hidden sm:block">{style.description}</p>
                                  </div>
                                ))}
                              </div>

                              {avatarData.selectedStyle && (
                                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
                                    <p className="text-green-400 text-xs sm:text-sm">
                                      Selected: <strong>{getSelectedStyle()?.name}</strong>
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Wallet Section */}
                    {avatarData.customType === "wallet" && (
                      <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                        {!avatarData.connectedWallet ? (
                          <div className="text-center p-4 sm:p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                            <div className="text-xl sm:text-2xl mb-3 text-gray-400">🔗</div>
                            <p className="text-sm sm:text-base text-gray-300 font-medium mb-4">
                              Connect wallet to access NFTs
                            </p>
                            <Button
                              onClick={connectWallet}
                              className="bg-green-500 hover:bg-green-600 text-white transition-all duration-150 text-sm sm:text-base h-9 sm:h-auto"
                            >
                              Connect Wallet
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="p-3 sm:p-4 bg-green-900/20 rounded-lg border border-green-700">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                                <div>
                                  <p className="text-green-400 text-sm sm:text-base">Connected</p>
                                  <code className="text-xs sm:text-sm bg-gray-800 px-2 py-1 rounded text-gray-300">
                                    {avatarData.connectedWallet}
                                  </code>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-sm sm:text-base text-gray-300 mb-3">Available NFTs</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                {[
                                  "🐵 Bored Ape #1234",
                                  "🐱 Cool Cat #5678",
                                  "🤖 Robot #9012",
                                  "🦄 Unicorn #3456",
                                  "👾 Pixel #7890",
                                  "🎨 Art #2468",
                                ].map((nft) => (
                                  <div
                                    key={nft}
                                    onClick={() => selectNFT(nft)}
                                    className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-150 border text-center hover:scale-[1.01] ${
                                      avatarData.selectedNFT === nft
                                        ? "border-green-500 bg-green-500/10"
                                        : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                                    }`}
                                  >
                                    <div className="text-lg sm:text-xl mb-1">{nft.split(" ")[0]}</div>
                                    <p className="text-xs text-gray-400">{nft.split(" ").slice(1).join(" ")}</p>
                                  </div>
                                ))}
                              </div>

                              {avatarData.selectedNFT && (
                                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
                                    <p className="text-green-400 text-xs sm:text-sm">
                                      Selected: <strong>{avatarData.selectedNFT}</strong>
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Name Your Avatar (previously Step 2) */}
            {step === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-5">
                  {/* Avatar Name */}
                  <div>
                    <Label htmlFor="avatar-name" className="text-sm font-medium text-gray-300 mb-2 block">
                      Avatar Name *
                    </Label>
                    <Input
                      id="avatar-name"
                      placeholder="Enter avatar name..."
                      value={avatarData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-150 h-10 sm:h-auto"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be the display name for your avatar</p>
                  </div>

                  {/* Personality Description */}
                  <div>
                    <Label
                      htmlFor="personality"
                      className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2"
                    >
                      Personality Description
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center cursor-help">
                              <span className="text-xs text-gray-300">?</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Describe the avatar's personality traits, behavior, or characteristics</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <textarea
                      id="personality"
                      placeholder="Describe the personality... (e.g., friendly, professional, quirky, mysterious)"
                      value={avatarData.personality || ""}
                      onChange={(e) => handlePersonalityChange(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-150 rounded-md px-3 py-2 text-sm resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Help define your avatar's character and behavior
                    </p>
                  </div>

                  {/* Character Inspiration */}
                  <div>
                    <Label
                      htmlFor="character-names"
                      className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2"
                    >
                      Character Inspiration
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center cursor-help">
                              <span className="text-xs text-gray-300">?</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Names of characters, celebrities, or personas that inspire this avatar</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="character-names"
                      placeholder="Character names or inspirations... (e.g., Hermione Granger, Tony Stark, Yoda)"
                      value={avatarData.characterNames || ""}
                      onChange={(e) => handleCharacterNamesChange(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-150 h-10 sm:h-auto"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Reference characters that inspire this avatar's look or personality
                    </p>
                  </div>
                </div>

                {/* Configuration Summary */}
                {(avatarData.name || avatarData.personality || avatarData.characterNames) && (
                  <div className="p-4 sm:p-5 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h4 className="text-sm sm:text-base font-medium text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                      Configuration Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      {avatarData.name && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">Name:</span>
                          <span className="text-green-400 font-medium">{avatarData.name}</span>
                        </div>
                      )}
                      {avatarData.personality && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">Personality:</span>
                          <span className="text-gray-300 flex-1">{avatarData.personality}</span>
                        </div>
                      )}
                      {avatarData.characterNames && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 min-w-[60px]">Inspired by:</span>
                          <span className="text-blue-400">{avatarData.characterNames}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Personality Suggestions */}
                <div className="p-3 sm:p-4 bg-blue-900/10 rounded-lg border border-blue-800/50">
                  <h5 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                    <span className="text-blue-400">💡</span>
                    Quick Personality Ideas
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      "Friendly & Approachable",
                      "Professional & Confident",
                      "Creative & Artistic",
                      "Tech-Savvy & Modern",
                      "Wise & Thoughtful",
                      "Energetic & Playful",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handlePersonalityChange(suggestion)}
                        className="text-xs p-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-150 text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-blue-300/70 mt-2">
                    Click any suggestion to use it, or write your own description
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Connect Store (previously Step 1) */}
            {step === 3 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-400 text-lg sm:text-xl">🔐</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-blue-400 mb-2">Connect to Shopify</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    Connect to your Shopify store to save and manage your avatars
                  </p>
                  <div className="mt-2 p-2 bg-blue-900/10 rounded border border-blue-800/30">
                    <p className="text-xs text-blue-300">💡 Your progress is automatically saved as you work</p>
                  </div>
                </div>

                {!avatarData.isAuthenticated ? (
                  <div className="space-y-4 sm:space-y-6">
                    {/* OAuth Login Option */}
                    <div className="p-4 sm:p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                      <div className="text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <span className="text-green-400 text-2xl sm:text-3xl">🛍️</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-medium text-gray-100 mb-2">Shopify OAuth</h4>
                        <p className="text-sm text-gray-400 mb-4">Securely connect using Shopify's OAuth system</p>
                        <Button
                          onClick={handleShopifyLogin}
                          className="bg-green-500 hover:bg-green-600 text-white transition-all duration-150 h-10 sm:h-auto w-full sm:w-auto"
                        >
                          <span className="mr-2">🔗</span>
                          Connect with Shopify
                        </Button>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-xs sm:text-sm">
                        <span className="bg-[#0a0a0a] px-3 text-gray-400">or</span>
                      </div>
                    </div>

                    {/* Manual Token Entry */}
                    <div className="p-4 sm:p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-orange-400 text-lg sm:text-xl">🔑</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-medium text-gray-100 mb-2">Access Token</h4>
                        <p className="text-sm text-gray-400 mb-4">Enter your Shopify private app access token</p>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label htmlFor="access-token" className="text-sm font-medium text-gray-300 mb-2 block">
                            Private App Access Token
                          </Label>
                          <Input
                            id="access-token"
                            type="password"
                            placeholder="shpat_..."
                            value={avatarData.accessToken || ""}
                            onChange={(e) => handleAccessTokenChange(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20 transition-all duration-150 h-10 sm:h-auto font-mono text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Find this in your Shopify admin under Apps → Private apps
                          </p>
                        </div>

                        <Button
                          onClick={handleTokenSubmit}
                          disabled={!avatarData.accessToken || avatarData.accessToken.length < 10}
                          className="bg-blue-500 hover:bg-blue-600 text-white transition-all duration-150 disabled:opacity-50 h-10 sm:h-auto w-full"
                        >
                          <span className="mr-2">✓</span>
                          Authenticate
                        </Button>
                      </div>
                    </div>

                    {/* Help Section with Modal */}
                    <div className="p-3 sm:p-4 bg-blue-900/10 rounded-lg border border-blue-800/50">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 text-xs sm:text-sm">ℹ️</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm sm:text-base font-medium text-blue-400 mb-1">Need help?</h5>
                          <p className="text-xs sm:text-sm text-gray-400 mb-3">
                            To create a private app: Go to your Shopify admin → Settings → Apps and sales channels →
                            Develop apps → Create an app → Configure Admin API scopes → Install app
                          </p>

                          <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-150 h-8 text-xs"
                              >
                                <span className="mr-1">📖</span>
                                Step-by-Step Guide
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Authenticated State */
                  <div className="space-y-4 sm:space-y-6">
                    <div className="p-4 sm:p-6 bg-green-900/20 rounded-lg border border-green-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg sm:text-xl">✓</span>
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-medium text-green-400">Connected Successfully</h4>
                            <p className="text-sm text-green-200">
                              {avatarData.shopifyStore
                                ? `Store: ${avatarData.shopifyStore}`
                                : "Authentication verified"}
                            </p>
                            {avatarData.accessToken && (
                              <p className="text-xs text-green-300 font-mono mt-1">
                                Token: {avatarData.accessToken.substring(0, 12)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          size="sm"
                          className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 transition-all duration-150 h-8 sm:h-auto"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                      <h4 className="text-base sm:text-lg font-medium text-gray-100 mb-3">Ready to Continue</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-300">Shopify connection established</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-300">API access verified</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-300">Ready for avatar creation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Generate & Review (unchanged) */}
            {step === 4 && !isCreating && generatedVariations.length === 0 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-400 text-lg sm:text-xl">✨</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-green-400 mb-2">Ready to Generate</h3>
                  <p className="text-sm sm:text-base text-gray-400">Review configuration and generate avatar</p>
                </div>

                {/* Preview */}
                <div className="p-4 sm:p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-center mb-4 sm:mb-6">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
                      {renderAvatarPreview(96)}
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-medium text-center text-green-400 mb-4">
                    {avatarData.name || "Avatar"}
                  </h3>

                  {/* Configuration Details */}
                  <div className="grid gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="font-medium text-sm sm:text-base text-gray-300 mb-2">Configuration</h4>
                      <div className="text-xs sm:text-sm text-gray-400 space-y-1">
                        <p>
                          Name: <span className="text-gray-200">{avatarData.name}</span>
                        </p>
                        {avatarData.personality && (
                          <p>
                            Personality: <span className="text-gray-200">{avatarData.personality}</span>
                          </p>
                        )}
                        {avatarData.characterNames && (
                          <p>
                            Inspired by: <span className="text-blue-300">{avatarData.characterNames}</span>
                          </p>
                        )}
                        <p>
                          Type:{" "}
                          <span className="text-gray-200">
                            {avatarData.type === "rom-unicorn" ? "Template Avatar" : "Custom"}
                          </span>
                        </p>
                        {avatarData.type === "rom-unicorn" && (
                          <p>
                            Template: <span className="text-gray-200">{avatarData.romUnicornType}</span>
                          </p>
                        )}
                        {avatarData.type === "custom" && (
                          <p>
                            Source:{" "}
                            <span className="text-gray-200">
                              {avatarData.customType === "upload" ? "Uploaded Image" : "NFT"}
                            </span>
                          </p>
                        )}
                        {avatarData.selectedStyle && (
                          <p>
                            Style: <span className="text-gray-200">{getSelectedStyle()?.name}</span>
                          </p>
                        )}
                        {avatarData.selectedNFT && (
                          <p>
                            NFT: <span className="text-gray-200">{avatarData.selectedNFT}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h4 className="font-medium text-sm sm:text-base text-green-400 mb-2">Generation Info</h4>
                      <div className="text-xs sm:text-sm text-gray-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          <span>Configuration validated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          <span>Ready for generation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                          <span>8 expressions will be created</span>
                        </div>
                        {avatarData.selectedStyle && (
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                            <span>Style transformation ready</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <Button
                    onClick={() => setStep(3)}
                    variant="outline"
                    className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 transition-all duration-150 h-10 sm:h-auto order-2 sm:order-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={createAvatar}
                    className="bg-green-500 hover:bg-green-600 text-white transition-all duration-150 h-10 sm:h-auto order-1 sm:order-2"
                  >
                    <span className="mr-2">✨</span>
                    Generate Avatar
                  </Button>
                </div>
              </div>
            )}

            {/* Creation Animation */}
            {step === 4 && isCreating && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-400 text-lg sm:text-xl">🎨</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-blue-400 mb-2">Generating Avatar</h3>
                  <p className="text-sm sm:text-base text-gray-400">AI is processing facial expressions...</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="w-full bg-gray-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${creationProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">{Math.round(creationProgress)}% Complete</span>
                    <span className="text-gray-400">
                      Expression {generatedVariations.length} of {facialExpressions.length}
                    </span>
                  </div>
                </div>

                {/* Original Avatar */}
                <div className="text-center">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-3 sm:mb-4">Source Image</h4>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-700 rounded-lg mx-auto flex items-center justify-center border border-gray-600">
                    {renderAvatarPreview(80)}
                  </div>
                </div>

                {/* Status */}
                <div className="text-center p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-center gap-2 text-gray-300">
                    <div className="animate-spin text-lg sm:text-xl text-blue-400">⚡</div>
                    <p className="font-medium text-sm sm:text-base">
                      {generatedVariations.length === 0 && "Initializing AI processing..."}
                      {generatedVariations.length > 0 &&
                        generatedVariations.length < 3 &&
                        "Analyzing facial structure..."}
                      {generatedVariations.length >= 3 && generatedVariations.length < 6 && "Generating expressions..."}
                      {generatedVariations.length >= 6 && generatedVariations.length < 8 && "Finalizing variations..."}
                      {generatedVariations.length === 8 && "Completing generation..."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Creation Complete - similar to original, omitted for brevity */}

            {/* Navigation Buttons */}
            {step < 4 && (
              <div className="flex justify-between pt-4 sm:pt-6 border-t border-gray-800">
                <Button
                  onClick={prevStep}
                  disabled={step === 1}
                  variant="outline"
                  className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-all duration-150 h-10 sm:h-auto"
                >
                  Previous
                </Button>

                <Button
                  onClick={nextStep}
                  disabled={(step === 3 && !avatarData.isAuthenticated) || (step === 2 && !avatarData.name)}
                  className="bg-green-500 hover:bg-green-600 text-white transition-all duration-150 disabled:opacity-50 h-10 sm:h-auto"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 