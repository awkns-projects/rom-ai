import { auth } from '@/app/(auth)/auth';
import { getChatById, updateMessage } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user) {
    throw new ChatSDKError('unauthorized:chat', 'User not authenticated');
  }

  try {
    const { chatId, messageId, message } = await request.json();

    if (!chatId || !messageId || !message) {
      throw new ChatSDKError(
        'forbidden:chat',
        'Missing required parameters: chatId, messageId, or message',
      );
    }

    // Verify chat ownership
    const chat = await getChatById({ id: chatId });
    if (!chat) {
      throw new ChatSDKError('forbidden:chat', 'Chat not found');
    }

    if (chat.userId !== session.user.id) {
      throw new ChatSDKError('forbidden:chat', 'User does not own this chat');
    }

    // Update the message
    const updatedMessage = {
      role: message.role,
      parts: message.parts,
      attachments: message.attachments || [],
      createdAt: message.createdAt,
    };

    await updateMessage({
      messageId,
      message: updatedMessage,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to update message');
  }
} 