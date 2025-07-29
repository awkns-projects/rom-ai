import { auth } from '@/app/(auth)/auth';
import type { ArtifactKind } from '@/components/artifact';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveOrUpdateDocument,
  updateDocument,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter id is missing',
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (!document) {
    return new ChatSDKError('not_found:document').toResponse();
  }

  if (document.userId !== session.user.id) {
    return new ChatSDKError('forbidden:document').toResponse();
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter id is required.',
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('not_found:document').toResponse();
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: ArtifactKind } =
    await request.json();

  const documents = await getDocumentsById({ id });

  if (documents.length > 0) {
    const [document] = documents;

    if (document.userId !== session.user.id) {
      return new ChatSDKError('forbidden:document').toResponse();
    }
  }

  const document = await saveOrUpdateDocument({
    id,
    content,
    title,
    kind,
    userId: session.user.id,
  });

  return Response.json(document, { status: 200 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter id is required.',
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  const { metadata }: { metadata: any } = await request.json();

  if (!metadata) {
    return new ChatSDKError(
      'bad_request:api',
      'Metadata is required for PATCH requests.',
    ).toResponse();
  }

  const documents = await getDocumentsById({ id });

  if (documents.length === 0) {
    return new ChatSDKError('not_found:document').toResponse();
  }

  const [document] = documents;

  if (document.userId !== session.user.id) {
    return new ChatSDKError('forbidden:document').toResponse();
  }

  // Merge existing metadata with new metadata
  const existingMetadata = (document.metadata as any) || {};
  
  // Deep merge mindMapStates to avoid overwriting other states
  const mergedMetadata = {
    ...existingMetadata,
    ...metadata,
    mindMapStates: {
      ...existingMetadata.mindMapStates,
      ...metadata.mindMapStates
    },
    lastUpdated: new Date().toISOString()
  };

  console.log('📝 Updating document metadata:', { 
    documentId: id, 
    existingMetadata: JSON.stringify(existingMetadata, null, 2),
    newMetadata: JSON.stringify(metadata, null, 2),
    mergedMetadata: JSON.stringify(mergedMetadata, null, 2)
  });

  try {
    const updatedDocument = await updateDocument({
      id,
      userId: session.user.id,
      metadata: mergedMetadata,
    });

    console.log('✅ Document metadata updated successfully');
    return Response.json(updatedDocument, { status: 200 });
  } catch (error) {
    console.error('❌ Error updating document metadata:', error);
    return new ChatSDKError(
      'bad_request:database',
      'Failed to update document metadata.',
    ).toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const timestamp = searchParams.get('timestamp');

  if (!id) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter id is required.',
    ).toResponse();
  }

  if (!timestamp) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter timestamp is required.',
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (document.userId !== session.user.id) {
    return new ChatSDKError('forbidden:document').toResponse();
  }

  const documentsDeleted = await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return Response.json(documentsDeleted, { status: 200 });
}
