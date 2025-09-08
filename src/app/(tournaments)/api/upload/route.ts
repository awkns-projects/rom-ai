import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// POST /api/upload - Handle file uploads for missions and solutions
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as string; // 'mission' | 'solution'
    const relatedId = formData.get('relatedId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedFiles: Array<{
      id: string;
      originalName: string;
      fileName: string;
      url: string;
      size: number;
      type: string;
    }> = [];

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', type);
    await mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large (max 10MB)` },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'text/markdown',
        'application/pdf',
        'application/json',
        'text/javascript',
        'text/typescript',
        'text/css',
        'text/html'
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const fileId = randomUUID();
      const extension = file.name.split('.').pop() || '';
      const fileName = `${fileId}.${extension}`;
      const filePath = join(uploadDir, fileName);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      uploadedFiles.push({
        id: fileId,
        originalName: file.name,
        fileName,
        url: `/uploads/${type}/${fileName}`,
        size: file.size,
        type: file.type
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
} 