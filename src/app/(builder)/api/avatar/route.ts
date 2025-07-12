import { auth } from '@/app/(auth)/auth';
import { 
  createAvatar, 
  getAvatarsByUserId, 
  getAvatarsByDocumentId,
  getAvatarById, 
  updateAvatar, 
  deleteAvatar,
  setActiveAvatar,
  getActiveAvatar 
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';

const createAvatarSchema = z.object({
  documentId: z.string().optional(),
  name: z.string().min(1).max(255),
  personality: z.string().optional(),
  characterNames: z.string().optional(),
  type: z.string().default('rom-unicorn'),
  romUnicornType: z.string().optional(),
  customType: z.string().optional(),
  uploadedImage: z.string().optional(),
  selectedStyle: z.string().optional(),
  connectedWallet: z.string().optional(),
  selectedNFT: z.string().optional(),
  unicornParts: z.any().optional(),
  isActive: z.boolean().default(false),
});

const updateAvatarSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255).optional(),
  personality: z.string().optional(),
  characterNames: z.string().optional(),
  type: z.string().optional(),
  romUnicornType: z.string().optional(),
  customType: z.string().optional(),
  uploadedImage: z.string().optional(),
  selectedStyle: z.string().optional(),
  connectedWallet: z.string().optional(),
  selectedNFT: z.string().optional(),
  unicornParts: z.any().optional(),
  isActive: z.boolean().optional(),
});

const setActiveAvatarSchema = z.object({
  avatarId: z.string(),
  documentId: z.string().optional(),
});

// GET /api/avatar - Get all avatars for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:auth').toResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const avatarId = searchParams.get('id');
    const activeOnly = searchParams.get('active') === 'true';
    const documentId = searchParams.get('documentId');

    if (avatarId) {
      // Get specific avatar
      const avatar = await getAvatarById({ id: avatarId });
      
      if (!avatar) {
        return new ChatSDKError('not_found:api').toResponse();
      }
      
      if (avatar.userId !== session.user.id) {
        return new ChatSDKError('forbidden:api').toResponse();
      }
      
      return Response.json(avatar);
    } else if (activeOnly) {
      // Get active avatar
      const activeAvatar = await getActiveAvatar({ 
        userId: session.user.id,
        documentId: documentId || undefined
      });
      return Response.json(activeAvatar || null);
    } else {
      // Get all avatars for user, optionally filtered by document
      const avatars = documentId 
        ? await getAvatarsByDocumentId({ 
            documentId,
            userId: session.user.id, 
            limit 
          })
        : await getAvatarsByUserId({ 
            userId: session.user.id, 
            limit 
          });
      
      return Response.json(avatars);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError('bad_request:api').toResponse();
    }
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

// POST /api/avatar - Create a new avatar
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:auth').toResponse();
    }

    const body = await request.json();
    const validatedData = createAvatarSchema.parse(body);

    const newAvatar = await createAvatar({
      userId: session.user.id,
      ...validatedData,
    });

    return Response.json(newAvatar, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError('bad_request:api').toResponse();
    }
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

// PUT /api/avatar - Update an avatar or set active avatar
export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:auth').toResponse();
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'set-active') {
      // Set active avatar
      const { avatarId, documentId } = setActiveAvatarSchema.parse(body);
      
      // Verify avatar belongs to user
      const avatar = await getAvatarById({ id: avatarId });
      if (!avatar || avatar.userId !== session.user.id) {
        return new ChatSDKError('forbidden:api').toResponse();
      }
      
      const activeAvatar = await setActiveAvatar({
        userId: session.user.id,
        avatarId,
        documentId,
      });
      
      return Response.json(activeAvatar);
    } else {
      // Update avatar
      const validatedData = updateAvatarSchema.parse(body);
      const { id, ...updateData } = validatedData;
      
      // Verify avatar belongs to user
      const existingAvatar = await getAvatarById({ id });
      if (!existingAvatar || existingAvatar.userId !== session.user.id) {
        return new ChatSDKError('forbidden:api').toResponse();
      }
      
      const updatedAvatar = await updateAvatar({
        id,
        ...updateData,
      });
      
      return Response.json(updatedAvatar);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError('bad_request:api').toResponse();
    }
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

// DELETE /api/avatar - Delete an avatar
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:auth').toResponse();
    }

    const { searchParams } = new URL(request.url);
    const avatarId = searchParams.get('id');
    
    if (!avatarId) {
      return new ChatSDKError('bad_request:api', 'Avatar ID is required').toResponse();
    }

    // Verify avatar belongs to user
    const avatar = await getAvatarById({ id: avatarId });
    if (!avatar || avatar.userId !== session.user.id) {
      return new ChatSDKError('forbidden:api').toResponse();
    }

    await deleteAvatar({ id: avatarId });
    
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
} 