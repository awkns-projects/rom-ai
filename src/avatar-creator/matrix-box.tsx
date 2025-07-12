"use client"

import { useRef, useMemo, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, Text, Sphere, Ring } from "@react-three/drei"
import * as THREE from "three"

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
  return (
    <div style={{height: '600px'}} className="w-full bg-black overflow-hidden rounded-lg">
      <Canvas camera={{ position: [4, 4, 4], fov: 60 }}>
        <Scene onUnicornGenerated={onUnicornGenerated} />
      </Canvas>
    </div>
  )
}

function Scene({ onUnicornGenerated }: MatrixBoxProps) {
  return (
    <>
      <color attach="background" args={["#000"]} />
      <ambientLight intensity={0.1} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#00ff41" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#0066ff" />
      <pointLight position={[0, 10, 0]} intensity={2} color="#ffffff" />

      <UnicornLootBox onUnicornGenerated={onUnicornGenerated} />
      <Environment preset="night" />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={8} />
    </>
  )
}

function UnicornLootBox({ onUnicornGenerated }: MatrixBoxProps) {
  const [hovered, setHovered] = useState(false)
  const [charging, setCharging] = useState(false)
  const [chargeLevel, setChargeLevel] = useState(0)
  const [exploding, setExploding] = useState(false)
  const [opened, setOpened] = useState(false)
  const [streak, setStreak] = useState(0)
  const [currentUnicorn, setCurrentUnicorn] = useState<UnicornParts | null>(null)

  const boxRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  // Animation states
  const [scale, setScale] = useState(1)
  const [rotationSpeed, setRotationSpeed] = useState(1)
  const [glowIntensity, setGlowIntensity] = useState(0.1)
  const [boxOpacity, setBoxOpacity] = useState(0.1)
  const [unicornScale, setUnicornScale] = useState(0)
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [energyRingScale, setEnergyRingScale] = useState(0)

  // Determine rarity and unicorn
  const { rarityColor, rarityName } = useMemo(() => {
    const rarities = {
      common: { color: "#888888", name: "COMMON", chance: 0.5 },
      rare: { color: "#0099ff", name: "RARE", chance: 0.3 },
      epic: { color: "#9933ff", name: "EPIC", chance: 0.15 },
      legendary: { color: "#ffaa00", name: "LEGENDARY", chance: 0.05 },
    }

    // Determine rarity based on streak bonus
    const rand = Math.random() - streak * 0.02 // Streak bonus
    let selectedRarity: keyof typeof rarities = "common"

    if (rand < 0.05) selectedRarity = "legendary"
    else if (rand < 0.2) selectedRarity = "epic"
    else if (rand < 0.5) selectedRarity = "rare"

    const rarityData = rarities[selectedRarity]

    return {
      rarityColor: rarityData.color,
      rarityName: rarityData.name,
    }
  }, [exploding, streak])

  // Mouse events
  const handleMouseDown = () => {
    if (!exploding && !opened) {
      setCharging(true)
    }
  }

  const handleMouseUp = () => {
    if (charging && chargeLevel > 0.3 && !exploding) {
      setCharging(false)
      setExploding(true)
      setStreak((prev) => prev + 1)

      // Generate new unicorn
      const newUnicorn = generateRandomUnicorn()
      setCurrentUnicorn(newUnicorn)
      
      // Notify parent component only once
      if (onUnicornGenerated) {
        onUnicornGenerated(newUnicorn)
      }

      // Camera shake
      setShakeIntensity(1)

      // Show the unicorn after a short delay
      setTimeout(() => {
        setOpened(true)
      }, 500)
    } else {
      setCharging(false)
      setChargeLevel(0)
    }
  }

  const handleReset = () => {
    setExploding(false)
    setOpened(false)
    setCharging(false)
    setChargeLevel(0)
    setShakeIntensity(0)
  }

  // Main animation loop
  useFrame((state, delta) => {
    // Charging animation
    if (charging) {
      setChargeLevel((prev) => Math.min(prev + delta * 0.8, 1))
    }

    // Scale animations
    const targetScale = hovered ? 1.05 : charging ? 1 + chargeLevel * 0.3 : exploding ? 0.1 : 1
    setScale((prev) => THREE.MathUtils.lerp(prev, targetScale, delta * 8))

    // Rotation speed
    const targetRotSpeed = charging ? 1 + chargeLevel * 5 : exploding ? 15 : hovered ? 1.5 : 1
    setRotationSpeed((prev) => THREE.MathUtils.lerp(prev, targetRotSpeed, delta * 4))

    // Glow intensity
    const targetGlow = charging ? chargeLevel * 2 : exploding ? 3 : hovered ? 0.3 : 0.1
    setGlowIntensity((prev) => THREE.MathUtils.lerp(prev, targetGlow, delta * 6))

    // Box opacity
    const targetOpacity = exploding ? 0 : 0.1
    setBoxOpacity((prev) => THREE.MathUtils.lerp(prev, targetOpacity, delta * 8))

    // Unicorn scale
    const targetUnicornScale = opened ? 1 : 0
    setUnicornScale((prev) => THREE.MathUtils.lerp(prev, targetUnicornScale, delta * 4))

    // Energy ring
    const targetRingScale = charging ? chargeLevel * 2 : 0
    setEnergyRingScale((prev) => THREE.MathUtils.lerp(prev, targetRingScale, delta * 6))

    // Camera shake
    if (shakeIntensity > 0) {
      setShakeIntensity((prev) => Math.max(0, prev - delta * 2))
      const shake = shakeIntensity * 0.1
      camera.position.x += (Math.random() - 0.5) * shake
      camera.position.y += (Math.random() - 0.5) * shake
      camera.position.z += (Math.random() - 0.5) * shake
    }

    // Box rotation
    if (boxRef.current) {
      boxRef.current.rotation.y += delta * rotationSpeed * 0.5
      boxRef.current.rotation.x = Math.sin(state.clock.elapsedTime * rotationSpeed * 0.3) * 0.1
      boxRef.current.rotation.z = Math.sin(state.clock.elapsedTime * rotationSpeed * 0.2) * 0.05
    }
  })

  return (
    <group>
      {/* Energy Rings */}
      {charging && (
        <group scale={energyRingScale}>
          <Ring args={[2, 2.2, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color="#00ff41" transparent opacity={0.6} />
          </Ring>
          <Ring args={[2.5, 2.7, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color="#0066ff" transparent opacity={0.4} />
          </Ring>
        </group>
      )}

      {/* Main Loot Box */}
      {!exploding && !opened && (
        <group
          ref={boxRef}
          scale={[scale, scale, scale]}
          onPointerDown={handleMouseDown}
          onPointerUp={handleMouseUp}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {/* Glass Box Container */}
          <mesh>
            <boxGeometry args={[2, 2, 2]} />
            <meshPhysicalMaterial
              transparent
              opacity={boxOpacity}
              transmission={0.9}
              thickness={0.1}
              roughness={0}
              metalness={0}
              color={charging ? "#00ff41" : "#00ff41"}
              emissive={charging ? "#001100" : "#001100"}
              emissiveIntensity={glowIntensity}
            />
          </mesh>

          {/* Pulsing Core */}
          {!exploding && !opened && (
            <Sphere args={[0.3]} position={[0, 0, 0]}>
              <meshBasicMaterial color="#00ff41" transparent opacity={charging ? chargeLevel * 0.8 : 0.2} />
            </Sphere>
          )}

          {/* Box Edges */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(2, 2, 2)]} />
            <lineBasicMaterial color="#00ff41" opacity={boxOpacity * 5} transparent />
          </lineSegments>

          {/* Matrix Rain */}
          {!exploding && !opened && <MatrixRain intensity={charging ? chargeLevel : 1} />}
        </group>
      )}

      {/* Unicorn Display */}
      {exploding && currentUnicorn && (
        <group scale={unicornScale} onClick={handleReset}>
          {/* Floating Unicorn Emoji */}
          <group position={[0, Math.sin(Date.now() * 0.003) * 0.2, 0]}>
            <Text
              position={[0, 0, 0]}
              fontSize={3}
              anchorX="center"
              anchorY="middle"
              material-transparent
              material-opacity={unicornScale}
            >
              🦄
            </Text>
          </group>

          {/* Rarity Banner */}
          <Text
            position={[0, -1.8, 0]}
            fontSize={0.4}
            color={rarityColor}
            anchorX="center"
            anchorY="middle"
            material-transparent
            material-opacity={unicornScale}
          >
            {rarityName} UNICORN!
          </Text>

          {/* Unicorn Parts Info */}
          <Text
            position={[0, -2.4, 0]}
            fontSize={0.2}
            color="#00ff41"
            anchorX="center"
            anchorY="middle"
            material-transparent
            material-opacity={unicornScale}
          >
            {`Body: ${currentUnicorn.body.split('.')[0]}`}
          </Text>
          
          <Text
            position={[0, -2.7, 0]}
            fontSize={0.2}
            color="#0099ff"
            anchorX="center"
            anchorY="middle"
            material-transparent
            material-opacity={unicornScale}
          >
            {`Hair: ${currentUnicorn.hair.split('.')[0]}`}
          </Text>

          {/* Streak Counter */}
          <Text
            position={[0, -3.2, 0]}
            fontSize={0.25}
            color="#ffff00"
            anchorX="center"
            anchorY="middle"
            material-transparent
            material-opacity={unicornScale}
          >
            STREAK: {streak}x
          </Text>

          {/* Instructions */}
          <Text
            position={[0, -3.6, 0]}
            fontSize={0.18}
            color="#888"
            anchorX="center"
            anchorY="middle"
            material-transparent
            material-opacity={unicornScale}
          >
            Click to generate another
          </Text>
        </group>
      )}

      {/* Charge Indicator */}
      {charging && (
        <group position={[0, -3, 0]}>
          <Text fontSize={0.3} color="#00ff41" anchorX="center" anchorY="middle">
            {`CHARGING... ${Math.floor(chargeLevel * 100)}%`}
          </Text>
          <mesh position={[0, -0.5, 0]} scale={[4 * chargeLevel, 0.1, 0.1]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#00ff41" />
          </mesh>
        </group>
      )}

      {/* Hover Instructions */}
      {hovered && !charging && !exploding && (
        <Text position={[0, -3, 0]} fontSize={0.25} color="#888" anchorX="center" anchorY="middle">
          Hold to charge, release to generate unicorn!
        </Text>
      )}
    </group>
  )
}

function MatrixRain({ intensity = 1 }: { intensity?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  const matrixChars = useMemo(() => {
    const chars =
      "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const columns = 8
    const rows = 12
    const streams: Array<{
      x: number
      z: number
      chars: Array<{
        char: string
        y: number
        opacity: number
        speed: number
      }>
    }> = []

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < columns; j++) {
        const stream = {
          x: (i - columns / 2 + 0.5) * 0.4,
          z: (j - columns / 2 + 0.5) * 0.4,
          chars: [] as Array<{
            char: string
            y: number
            opacity: number
            speed: number
          }>,
        }

        for (let k = 0; k < rows; k++) {
          stream.chars.push({
            char: chars[Math.floor(Math.random() * chars.length)],
            y: 1 - k * 0.2,
            opacity: Math.max(0, 1 - k * 0.15),
            speed: (0.5 + Math.random() * 0.5) * intensity,
          })
        }

        streams.push(stream)
      }
    }

    return streams
  }, [])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, streamIndex) => {
        const stream = matrixChars[streamIndex]
        if (stream) {
          child.children.forEach((textMesh: any, charIndex) => {
            const char = stream.chars[charIndex]
            if (char) {
              char.y -= char.speed * delta
              if (char.y < -1) {
                char.y = 1
                char.char =
                  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[
                    Math.floor(Math.random() * 87)
                  ]
              }
              textMesh.position.y = char.y
              if (textMesh.material) {
                textMesh.material.opacity = Math.max(0, (char.opacity * (char.y + 1)) / 2) * intensity
              }
            }
          })
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {matrixChars.map((stream, streamIndex) => (
        <group key={streamIndex} position={[stream.x, 0, stream.z]}>
          {stream.chars.map((char, charIndex) => (
            <Text
              key={charIndex}
              position={[0, char.y, 0]}
              fontSize={0.15}
              color="#00ff41"
              anchorX="center"
              anchorY="middle"
              material-transparent
              material-opacity={char.opacity}
            >
              {char.char}
            </Text>
          ))}
        </group>
      ))}
    </group>
  )
}
