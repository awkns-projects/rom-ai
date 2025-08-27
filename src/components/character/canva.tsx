"use client";

import { generateCharacter } from "./generateCharacter";

import { useRef, useMemo, useState, useEffect } from "react";

const memoryImages: Record<string, any> = [];

// Standard LPC sprite sheet row mapping
const SPRITE_ANIMATIONS = [
  { name: 'Spellcast Up', row: 0, frames: 7 },
  { name: 'Spellcast Left', row: 1, frames: 7 },
  { name: 'Spellcast Down', row: 2, frames: 7 },
  { name: 'Spellcast Right', row: 3, frames: 7 },
  { name: 'Thrust Up', row: 4, frames: 8 },
  { name: 'Thrust Left', row: 5, frames: 8 },
  { name: 'Thrust Down', row: 6, frames: 8 },
  { name: 'Thrust Right', row: 7, frames: 8 },
  { name: 'Walk Up', row: 8, frames: 9 },
  { name: 'Walk Left', row: 9, frames: 9 },
  { name: 'Walk Down', row: 10, frames: 9 },
  { name: 'Walk Right', row: 11, frames: 9 },
  { name: 'Slash Up', row: 12, frames: 6 },
  { name: 'Slash Left', row: 13, frames: 6 },
  { name: 'Slash Down', row: 14, frames: 6 },
  { name: 'Slash Right', row: 15, frames: 6 },
  { name: 'Shoot Up', row: 16, frames: 13 },
  { name: 'Shoot Left', row: 17, frames: 13 },
  { name: 'Shoot Down', row: 18, frames: 13 },
  { name: 'Shoot Right', row: 19, frames: 13 },
  { name: 'Hurt', row: 20, frames: 6 }
];

// Available background images
const BACKGROUND_IMAGES = [
  '/background/background_1.gif',
  '/background/background_2.gif',
  '/background/background_3.gif',
  '/background/background_4.gif',
  '/background/background_5.gif',
  '/background/background_6.gif',
  '/background/background_7.gif'
];

// Animation component for character movement
const CharacterAnimation = ({
  animation,
  characterInfo,
  backgroundImage,
  canvasWidth = 300,
  canvasHeight = 200,
  hideAnimationName = false
}: {
  animation: { name: string; row: number; frames: number };
  characterInfo: Record<string, any>;
  backgroundImage?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  hideAnimationName?: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLImageElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [horizontalPosition, setHorizontalPosition] = useState(0);

  const getImage = async (source: string) => {
    return await new Promise((resolve) => {
      if (memoryImages[source]) return resolve(memoryImages[source]);
      else {
        var img = new Image();
        img.src = source;
        img.onload = () => {
          memoryImages[source] = img;
          resolve(img);
        };
      }
    });
  };

  const gatherMaterials = () => {
    const materials: Record<string, any> = [];

    Object.keys(characterInfo).forEach((feature) => {
      if (characterInfo[feature].style.materials) {
        characterInfo[feature].style.materials.forEach(
          (material: Record<string, any>) => {
            materials.push({
              zPosition: material.zPosition,
              source: `/spritesheets/${material.source}${characterInfo[feature].style.variant}.png`,
            });
          }
        );
      }
    });

    return materials.sort((a: Record<string, any>, b: Record<string, any>) => {
      return a.zPosition - b.zPosition;
    });
  };

  const drawAnimationFrame = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const materials = gatherMaterials();

    for (const material of materials) {
      const img = (await getImage(material.source)) as HTMLImageElement;

      // Draw the specific frame from the sprite sheet
      // Always use 64x64 source frame but scale to fit canvas while maintaining aspect ratio
      const sourceFrameWidth = 64;
      const sourceFrameHeight = 64;
      const sourceX = currentFrame * sourceFrameWidth;
      const sourceY = animation.row * sourceFrameHeight;

      // Calculate character size maintaining 1:1 aspect ratio, but smaller than canvas
      const maxCharacterSize = Math.min(canvasWidth, canvasHeight) * 0.6; // Make character 60% of the smaller dimension
      const characterSize = maxCharacterSize;

      // Calculate horizontal position based on animation type
      let characterOffsetX;
      if (animation.name === 'Walk Left' || animation.name === 'Walk Right') {
        characterOffsetX = horizontalPosition;
      } else {
        characterOffsetX = (canvasWidth - characterSize) / 2;
      }

      const characterOffsetY = canvasHeight - characterSize; // Position at bottom of canvas

      try {
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceFrameWidth, sourceFrameHeight, // source rectangle (64x64)
          characterOffsetX, characterOffsetY, characterSize, characterSize // destination rectangle (centered and scaled)
        );
      } catch (err) {
        // If frame doesn't exist, show first frame of the animation
        ctx.drawImage(
          img,
          0, sourceY, sourceFrameWidth, sourceFrameHeight, // source rectangle (64x64)
          characterOffsetX, characterOffsetY, characterSize, characterSize // destination rectangle (centered and scaled)
        );
      }
    }
  };

  // Animation loop
  useEffect(() => {
    if (Object.keys(characterInfo).length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % animation.frames);

      // Handle horizontal movement for walk animations
      if (animation.name === 'Walk Left' || animation.name === 'Walk Right') {
        setHorizontalPosition((prevPos) => {
          const characterSize = Math.min(canvasWidth, canvasHeight) * 0.6;
          const moveSpeed = 2; // pixels per frame

          if (animation.name === 'Walk Right') {
            const newPos = prevPos + moveSpeed;
            // Wrap around when character goes off right side
            if (newPos > canvasWidth) {
              return -characterSize; // Start from left side
            }
            return newPos;
          } else { // Walk Left
            const newPos = prevPos - moveSpeed;
            // Wrap around when character goes off left side
            if (newPos < -characterSize) {
              return canvasWidth; // Start from right side
            }
            return newPos;
          }
        });
      }
    }, 150); // Change frame every 150ms

    return () => clearInterval(interval);
  }, [characterInfo, animation.frames, animation.name, canvasWidth, canvasHeight]);

  // Reset horizontal position when character or animation changes
  useEffect(() => {
    if (animation.name === 'Walk Left') {
      setHorizontalPosition(canvasWidth); // Start from right side for left movement
    } else if (animation.name === 'Walk Right') {
      const characterSize = Math.min(canvasWidth, canvasHeight) * 0.6;
      setHorizontalPosition(-characterSize); // Start from left side for right movement
    } else {
      setHorizontalPosition((canvasWidth - Math.min(canvasWidth, canvasHeight) * 0.6) / 2); // Center for other animations
    }
  }, [characterInfo, animation.name, canvasWidth, canvasHeight]);

  // Update background image source
  useEffect(() => {
    if (backgroundRef.current && backgroundImage) {
      backgroundRef.current.src = backgroundImage;
    }
  }, [backgroundImage]);

  // Draw current frame
  useEffect(() => {
    if (Object.keys(characterInfo).length > 0) {
      drawAnimationFrame();
    }
  }, [characterInfo, currentFrame, animation, horizontalPosition]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      {!hideAnimationName && (
        <div style={{ color: '#ffffff', fontSize: '0.75rem', textAlign: 'center' }}>
          {animation.name}
        </div>
      )}
      <div style={{ position: 'relative', width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
        {/* Animated background image */}
        <img
          ref={backgroundRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#1a1a1a',
            border: '1px solid #444'
          }}
          alt="Background"
        />
        {/* Transparent canvas for character */}
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
};

export default function CharacterGenerate({ showRandomCharacter = false }: { showRandomCharacter?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [buttonLock, setButtonLock] = useState(false);
  const [characterInfo, setCharacterInfo] = useState<Record<string, any>>({});
  const [selectedBackground, setSelectedBackground] = useState<string>('');
  const [selectedAnimation, setSelectedAnimation] = useState<{ name: string; row: number; frames: number } | null>(null);

  const getImage = async (source: string) => {
    return await new Promise((resolve) => {
      if (memoryImages[source]) return resolve(memoryImages[source]);
      else {
        var img = new Image();
        img.src = source;
        img.onload = () => {
          memoryImages[source] = img;
          resolve(img);
        };
      }
    });
  };

  const drawImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    try {
      ctx.drawImage(img, 0, 0);
    } catch (err) {
      console.error("Error: could not find " + img.src);
    }
  };

  const gatherMaterials = () => {
    const materials: Record<string, any> = [];

    Object.keys(characterInfo).forEach((feature) => {
      if (characterInfo[feature].style.materials) {
        characterInfo[feature].style.materials.forEach(
          (material: Record<string, any>) => {
            materials.push({
              zPosition: material.zPosition,
              source: `/spritesheets/${material.source}${characterInfo[feature].style.variant}.png`,
            });
          }
        );
      }
    });

    return materials.sort((a: Record<string, any>, b: Record<string, any>) => {
      return a.zPosition - b.zPosition;
    });
  };

  const renderCharacter = async () => {
    setButtonLock(true);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const itemsToDraw = gatherMaterials();

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var index = 0; index < itemsToDraw.length; index++) {
          const source = itemsToDraw[index].source;
          const img = (await getImage(source)) as HTMLImageElement;
          drawImage(ctx, img);
        }
      }
    }

    setButtonLock(false);
  };

  const callGenerate = () => {
    const characterData = generateCharacter();
    setCharacterInfo(characterData);

    // Select a random background
    const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    setSelectedBackground(BACKGROUND_IMAGES[randomIndex]);

    // Select a random animation
    const randomAnimationIndex = Math.floor(Math.random() * SPRITE_ANIMATIONS.length);
    setSelectedAnimation(SPRITE_ANIMATIONS[randomAnimationIndex]);
  };

  const characterCreated = useMemo(() => {
    return Object.keys(characterInfo).length > 0;
  }, [characterInfo]);

  useEffect(() => {
    if (characterCreated && canvasRef.current) {
      console.log('characterInfo', characterInfo)
      renderCharacter();
    }
  }, [characterInfo]);

  // Auto-generate character if showRandomCharacter prop is true
  useEffect(() => {
    if (showRandomCharacter && Object.keys(characterInfo).length === 0) {
      callGenerate();
    }
  }, [showRandomCharacter]);

  return (
    <div
      style={{
        minHeight: showRandomCharacter ? "auto" : "100vh",
        flexGrow: 1,
        backgroundColor: "#030712",
        color: "#ffffff",
      }}
    >
      <div style={{ padding: showRandomCharacter ? "8px" : "16px", display: "flex", flexDirection: "column", gap: showRandomCharacter ? "8px" : "16px" }}>
                 
        {!showRandomCharacter && (
          <div>
            <button
              style={{
                color: "#ffffff",
                border: "1px solid #ffffff",
                backgroundColor: "transparent",
                padding: "8px 16px",
                cursor: buttonLock ? "not-allowed" : "pointer",
                borderRadius: "4px",
                fontSize: "14px",
                opacity: buttonLock ? 0.5 : 1
              }}
              onClick={() => {
                callGenerate();
              }}
              disabled={buttonLock}
              onMouseEnter={(e) => {
                if (!buttonLock) {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.color = "#030712";
                }
              }}
              onMouseLeave={(e) => {
                if (!buttonLock) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
            >
              Generate
            </button>
          </div>
        )}

        {/* <canvas
          ref={canvasRef}
          id="spritesheet"
          width="832"
          height="1344"
          style={{
            display: characterCreated ? undefined : "none",
          }}
        >
          HTML5 Browser required.
        </canvas> */}

        {/* Character Animation */}
        {characterCreated && selectedAnimation && (
          <div style={{ marginTop: showRandomCharacter ? "8px" : "32px" }}>
            {/* <div style={{ marginBottom: "16px", color: "#ffffff", fontSize: "1.25rem", fontWeight: "500" }}>
              Character Animation
            </div> */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <CharacterAnimation
                animation={selectedAnimation}
                characterInfo={characterInfo}
                backgroundImage={selectedBackground}
                hideAnimationName={showRandomCharacter}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
