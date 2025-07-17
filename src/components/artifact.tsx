import type { Attachment, UIMessage } from 'ai';
import { formatDistance } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useDebounceCallback, useWindowSize } from 'usehooks-ts';
import type { Document, Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { Toolbar } from './toolbar';
import { VersionFooter } from './version-footer';
import { ArtifactActions } from './artifact-actions';
import { ArtifactCloseButton } from './artifact-close-button';
import { ArtifactMessages } from './artifact-messages';
import { useSidebar } from './ui/sidebar';
import { useArtifact } from '@/hooks/use-artifact';
import { imageArtifact } from '@/artifacts/image/client';
import { codeArtifact } from '@/artifacts/code/client';
import { sheetArtifact } from '@/artifacts/sheet/client';
import { textArtifact } from '@/artifacts/text/client';
import { agentArtifact } from '@/artifacts/agent/client';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';

export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
  agentArtifact,
];
export type ArtifactKind = (typeof artifactDefinitions)[number]['kind'];

export interface UIArtifact {
  title: string;
  documentId: string;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

function PureArtifact({
  chatId,
  input,
  setInput,
  handleSubmit,
  status,
  stop,
  attachments,
  setAttachments,
  append,
  messages,
  setMessages,
  reload,
  votes,
  isReadonly,
  selectedVisibilityType,
}: {
  chatId: string;
  input: string;
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: UseChatHelpers['stop'];
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  votes: Array<Vote> | undefined;
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  selectedVisibilityType: VisibilityType;
}) {
  const { artifact, setArtifact, metadata, setMetadata } = useArtifact();

  const apiEndpoint = artifact.documentId !== 'init' && artifact.status !== 'streaming'
    ? `/api/document?id=${artifact.documentId}`
    : null;

  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
    error: documentsError,
  } = useSWR<Array<Document>>(
    apiEndpoint,
    fetcher,
    {
      errorRetryCount: 8,
      errorRetryInterval: 500,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        console.log(`🔄 SWR Retry attempt ${retryCount} for document ${artifact.documentId}:`, {
          error: error?.message || error,
          status: error?.status,
          code: error?.code,
          retryCount,
          key,
          timestamp: new Date().toISOString()
        });

        if (error?.status >= 400 && error?.status < 500 && error?.status !== 404 && error?.status !== 408) {
          console.log(`❌ Not retrying for status ${error.status} - client error`);
          return;
        }

        if (error?.code && error.code !== 'not_found:document' && error.status >= 400 && error.status < 500) {
          console.log(`❌ Not retrying for error code ${error.code}`);
          return;
        }

        if (retryCount >= 8) {
          console.log(`❌ Max retries reached for document ${artifact.documentId}`);
          return;
        }

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artifact.documentId);
        const isRaceConditionLikely = isValidUUID && error?.status === 404 && retryCount <= 5;
        
        let timeout;
        if (isRaceConditionLikely) {
          const fastRetryDelays = [500, 1000, 1500, 2000, 3000];
          timeout = fastRetryDelays[retryCount - 1] || 3000;
          console.log(`🏃‍♂️ Fast retry for likely race condition in ${timeout}ms (attempt ${retryCount + 1}/8)`);
        } else {
          const baseDelay = 1000;
          const maxDelay = 8000;
          const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
          const jitter = Math.random() * 0.1 * exponentialDelay;
          timeout = exponentialDelay + jitter;
          console.log(`⏱️ Standard retry in ${Math.round(timeout)}ms (attempt ${retryCount + 1}/8)`);
        }
        
        setTimeout(() => revalidate({ retryCount }), timeout);
      },
      onError: (error) => {
        // Enhanced error logging with fallbacks for empty error objects
        const errorInfo = {
          error: error?.message || error || 'Unknown error',
          status: error?.status || 'Unknown status',
          code: error?.code || 'Unknown code',
          type: error?.type || 'Unknown type',
          errorObject: error,
          documentId: artifact.documentId,
          apiEndpoint,
          timestamp: new Date().toISOString()
        };
        
        console.error(`🚨 SWR Error for document ${artifact.documentId}:`, errorInfo);
        
        // If we get an empty error object, provide additional context
        if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
          console.warn(`⚠️ Received empty error object for document ${artifact.documentId}. This might indicate a network issue or server problem.`);
        }
      },
      onSuccess: (data) => {
        console.log(`✅ Successfully fetched document ${artifact.documentId}:`, {
          versionsCount: data?.length,
          latestTitle: data?.[data.length - 1]?.title,
          timestamp: new Date().toISOString()
        });
      },
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      dedupingInterval: 1000,
    }
  );

  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  const { open: isSidebarOpen } = useSidebar();

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        console.log(`📄 Setting artifact content from document ${artifact.documentId}:`, {
          contentLength: mostRecentDocument.content?.length || 0,
          contentPreview: mostRecentDocument.content?.substring(0, 100) || 'empty',
          timestamp: new Date().toISOString()
        });
        
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          content: mostRecentDocument.content ?? '',
        }));
      }
    }
  }, [documents, setArtifact]);

  useEffect(() => {
    mutateDocuments();
  }, [artifact.status, mutateDocuments]);

  useEffect(() => {
    if (
      documentsError?.status === 404 && 
      !isDocumentsFetching && 
      !artifact.content && 
      artifact.documentId !== 'init' &&
      artifact.status === 'idle'
    ) {
      console.log(`🔧 Document not found after retries, initializing with basic content for ${artifact.kind} artifact`);
      
      let initialContent = '';
      if (artifact.kind === 'agent') {
        initialContent = JSON.stringify({
          name: 'New Agent',
          description: '',
          domain: '',
          models: [],
          enums: [],
          actions: [],
          createdAt: new Date().toISOString()
        }, null, 2);
      }
      
      setArtifact((currentArtifact) => ({
        ...currentArtifact,
        content: initialContent,
      }));
      
      if (initialContent) {
        fetch(`/api/document?id=${artifact.documentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: artifact.title,
            content: initialContent,
            kind: artifact.kind,
          }),
        }).then(() => {
          console.log(`✅ Created initial document for ${artifact.documentId}`);
          mutateDocuments();
        }).catch((error) => {
          console.warn(`⚠️ Failed to create initial document:`, error);
        });
      }
    }
  }, [documentsError, isDocumentsFetching, artifact, setArtifact, mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact) return;

      const apiEndpoint = `/api/document?id=${artifact.documentId}`;

      mutate<Array<Document>>(
        apiEndpoint,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${artifact.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: artifact.title,
                content: updatedContent,
                kind: artifact.kind,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false },
      );
    },
    [artifact, mutate],
  );

  // const debouncedHandleContentChange = useDebounceCallback(
  //   handleContentChange,
  //   2000,
  // );

  // const saveContent = useCallback(
  //   (updatedContent: string, debounce: boolean) => {
  //     if (document && updatedContent !== document.content) {
  //       setIsContentDirty(true);

  //       if (debounce) {
  //         debouncedHandleContentChange(updatedContent);
  //       } else {
  //         handleContentChange(updatedContent);
  //       }
  //     }
  //   },
  //   [document, debouncedHandleContentChange, handleContentChange],
  // );




  const saveContent =
    (updatedContent: string) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);
        handleContentChange(updatedContent);
      }
    }

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    if (type === 'latest') {
      setCurrentVersionIndex(documents.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < documents.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!');
  }

  useEffect(() => {
    if (artifact.documentId !== 'init') {
      if (artifactDefinition.initialize) {
        artifactDefinition.initialize({
          documentId: artifact.documentId,
          setMetadata,
        });
      }
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  return (
    <AnimatePresence>
      {artifact.isVisible && (
        <motion.div
          data-testid="artifact"
          className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {!isMobile && (
            <motion.div
              className="fixed bg-background h-dvh"
              initial={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
              animate={{ width: windowWidth, right: 0 }}
              exit={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
            />
          )}

          {!isMobile && (
            <motion.div
              className="relative w-[400px] bg-black border-r border-green-500/20 h-dvh shrink-0"
              initial={{ opacity: 0, x: 10, scale: 1 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }}
              exit={{
                opacity: 0,
                x: 0,
                scale: 1,
                transition: { duration: 0 },
              }}
            >
              <AnimatePresence>
                {!isCurrentVersion && (
                  <motion.div
                    className="left-0 absolute h-dvh w-[400px] top-0 bg-black/80 z-50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>

              <div className="flex flex-col h-full justify-between items-center overflow-scroll">
                <ArtifactMessages
                  chatId={chatId}
                  status={status}
                  votes={votes}
                  messages={messages}
                  setMessages={setMessages}
                  reload={reload}
                  isReadonly={isReadonly}
                  artifactStatus={artifact.status}
                />

                <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
                  <MultimodalInput
                    chatId={chatId}
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                    status={status}
                    stop={stop}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    messages={messages}
                    append={append}
                    className="bg-black/50 border-green-500/20"
                    setMessages={setMessages}
                    selectedVisibilityType={selectedVisibilityType}
                  />
                </form>
              </div>
            </motion.div>
          )}

          <motion.div
            className="fixed bg-black h-dvh flex flex-col overflow-y-scroll md:border-l border-green-500/20"
            initial={
              isMobile
                ? {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
                : {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
            }
            animate={
              isMobile
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : 'calc(100dvw)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
                : {
                    opacity: 1,
                    x: 400,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth
                      ? windowWidth - 400
                      : 'calc(100dvw-400px)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
            }
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: 'spring',
                stiffness: 600,
                damping: 30,
              },
            }}
          >
            <div className="p-2 flex flex-row justify-between items-start">
              <div className="flex flex-row gap-4 items-start">
                <ArtifactCloseButton />

                <div className="flex flex-col">
                  <div className="font-medium hidden sm:block">{artifact.title}</div>

                  {isContentDirty ? (
                    <div className="text-sm text-muted-foreground">
                      Saving changes...
                    </div>
                  ) : document ? (
                    <div className="text-sm text-muted-foreground">
                      {`Updated ${formatDistance(
                        new Date(document.createdAt),
                        new Date(),
                        {
                          addSuffix: true,
                        },
                      )}`}
                    </div>
                  ) : (
                    <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
                  )}
                </div>
              </div>

              <ArtifactActions
                artifact={artifact}
                currentVersionIndex={currentVersionIndex}
                handleVersionChange={handleVersionChange}
                isCurrentVersion={isCurrentVersion}
                mode={mode}
                metadata={metadata}
                setMetadata={setMetadata}
              />
            </div>

            <div className="dark:bg-muted bg-background h-full overflow-y-scroll !max-w-full items-center">
              <artifactDefinition.content
                title={artifact.title}
                content={
                  isCurrentVersion
                    ? artifact.content
                    : getDocumentContentById(currentVersionIndex)
                }
                mode={mode}
                status={artifact.status}
                currentVersionIndex={currentVersionIndex}
                suggestions={[]}
                onSaveContent={saveContent}
                isInline={false}
                isCurrentVersion={isCurrentVersion}
                getDocumentContentById={getDocumentContentById}
                isLoading={
                  isDocumentsFetching && 
                  (!artifact.content || 
                   (documentsError?.status === 404 || documentsError?.code === 'not_found:document'))
                }
                metadata={metadata}
                setMetadata={setMetadata}
                setMessages={setMessages}
              />

              <AnimatePresence>
                {isCurrentVersion && (
                  <Toolbar
                    isToolbarVisible={isToolbarVisible}
                    setIsToolbarVisible={setIsToolbarVisible}
                    append={append}
                    status={status}
                    stop={stop}
                    setMessages={setMessages}
                    artifactKind={artifact.kind}
                  />
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {!isCurrentVersion && (
                <VersionFooter
                  currentVersionIndex={currentVersionIndex}
                  documents={documents}
                  handleVersionChange={handleVersionChange}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.input !== nextProps.input) return false;
  if (!equal(prevProps.messages, nextProps.messages.length)) return false;
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
    return false;

  return true;
});
