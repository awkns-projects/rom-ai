import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '../../../../(auth)/auth';
import fs from 'fs';
// Schema for validating unicorn parts upload
const UnicornPartsSchema = z.object({
  parts: z.object({
    body: z.string(),
    hair: z.string(), 
    eyes: z.string(),
    mouth: z.string(),
    accessory: z.string()
  })
});

// Mapping of local files to their blob URLs (will be populated from public folder)
const UNICORN_PARTS_MAP: Record<string, Record<string, string>> = {
  bodies: {
    "body.png": "public/images/unicorn/bodies/body.png",
    "body_h.png": "public/images/unicorn/bodies/body_h.png"
  },
  hair: {
    "hair_blue.png": "public/images/unicorn/hair/hair_blue.png", 
    "hair_g.png": "public/images/unicorn/hair/hair_g.png"
  },
  eyes: {
    "eye_h.png": "public/images/unicorn/eyes/eye_h.png",
    "eye_heart.png": "public/images/unicorn/eyes/eye_heart.png"
  },
  mouths: {
    "m_.png": "public/images/unicorn/mouths/m_.png",
    "m_ice.png": "public/images/unicorn/mouths/m_ice.png"
  },
  accessories: {
    "corn_ice1.png": "public/images/unicorn/accessories/corn_ice1.png",
    "corn_ice2.png": "public/images/unicorn/accessories/corn_ice2.png"
  }
};

// Function to upload a single image part to blob storage
async function uploadPartToBlob(
  category: string, 
  filename: string, 
  userId: string
): Promise<string> {
  try {
    // Get the local file path
    const localPath = UNICORN_PARTS_MAP[category]?.[filename];
    if (!localPath) {
      throw new Error(`Image not found: ${category}/${filename}`);
    }

    // // Read the file from the public directory
    // const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${localPath}`);
    // if (!response.ok) {
    //   throw new Error(`Failed to fetch ${localPath}: ${response.statusText}`);
    // }

    // const fileBuffer = await response.arrayBuffer();
    
    const fileBuffer = fs.readFileSync(localPath);

    // Generate unique filename with user ID and timestamp
    const timestamp = Date.now();
    const uniqueFilename = `avatars/${userId}/${timestamp}-${category}-${filename}`;
    
    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, fileBuffer, {
      access: 'public',
      contentType: 'image/png'
    });
    console.log('🔄 Uploaded unicorn part to blob:', blob);

    return blob.url;
  } catch (error) {
    console.error(`Failed to upload ${category}/${filename}:`, error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UnicornPartsSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid parts data', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { parts } = validatedData.data;
    const userId = session.user.id;

    console.log('🔄 Processing unicorn parts:', { parts, userId });

    // Check if Vercel Blob is available
    const hasVercelBlob = process.env.BLOB_READ_WRITE_TOKEN;
    console.log('🔄 Processing hasVercelBlob:', { hasVercelBlob });

    if (hasVercelBlob) {
      console.log('📦 Vercel Blob available, uploading to blob storage...');
      try {
        // Upload each part to blob storage
        const uploadedParts = {
          body: await uploadPartToBlob('bodies', parts.body, userId),
          hair: await uploadPartToBlob('hair', parts.hair, userId), 
          eyes: await uploadPartToBlob('eyes', parts.eyes, userId),
          mouth: await uploadPartToBlob('mouths', parts.mouth, userId),
          accessory: await uploadPartToBlob('accessories', parts.accessory, userId)
        };

        console.log('✅ Successfully uploaded all unicorn parts to blob:', uploadedParts);

        return NextResponse.json({
          success: true,
          uploadedParts,
          message: 'All unicorn parts uploaded to blob storage successfully',
          source: 'blob'
        });
      } catch (blobError) {
        console.warn('⚠️ Blob upload failed, falling back to local paths:', blobError);
        // Fall through to local path handling
      }
    } else {
      console.log('📁 Vercel Blob not available, using local paths...');
    }

    // Fallback: Convert to local static paths
    const uploadedParts = {
      body: UNICORN_PARTS_MAP.bodies[parts.body] || `/images/unicorn/bodies/${parts.body}`,
      hair: UNICORN_PARTS_MAP.hair[parts.hair] || `/images/unicorn/hair/${parts.hair}`,
      eyes: UNICORN_PARTS_MAP.eyes[parts.eyes] || `/images/unicorn/eyes/${parts.eyes}`,
      mouth: UNICORN_PARTS_MAP.mouths[parts.mouth] || `/images/unicorn/mouths/${parts.mouth}`,
      accessory: UNICORN_PARTS_MAP.accessories[parts.accessory] || `/images/unicorn/accessories/${parts.accessory}`
    };

    console.log('✅ Successfully mapped unicorn parts to local paths:', uploadedParts);

    return NextResponse.json({
      success: true,
      uploadedParts,
      message: 'All unicorn parts mapped to local paths successfully',
      source: 'local'
    });

  } catch (error) {
    console.error('❌ Error processing unicorn parts:', error);
    return NextResponse.json(
      { error: 'Failed to process unicorn parts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available unicorn parts
export async function GET() {
  try {
    return NextResponse.json({
      availableParts: UNICORN_PARTS_MAP,
      message: 'Available unicorn parts retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error retrieving unicorn parts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve unicorn parts' },
      { status: 500 }
    );
  }
} 