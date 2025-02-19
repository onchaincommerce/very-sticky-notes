'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import { useAccount } from 'wagmi';
import { StickyNote } from './StickyNote';
import { DecodedMessage } from '@xmtp/xmtp-js';

interface NoteMetadata {
  color: string;
  size: 'small' | 'medium' | 'large';
}

interface ParsedNote {
  id: string;
  content: string;
  metadata: NoteMetadata;
  senderAddress: string;
  sent: Date;
}

const HIDDEN_NOTES_KEY = 'xmtp-hidden-notes';

const SIZES = {
  small: { height: '150px', width: '200px' },
  medium: { height: '200px', width: '300px' },
  large: { height: '300px', width: '400px' }
};

const DEFAULT_NOTE_METADATA: NoteMetadata = {
  color: '#1e1e1e', // Dark theme default color
  size: 'medium'
};

export interface NotesListRef {
  fetchNotes: () => Promise<void>;
}

export const NotesList = forwardRef<NotesListRef, {
  searchQuery?: string;
  sortBy?: string;
}>((props, ref) => {
  const [notes, setNotes] = useState<ParsedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hiddenNotes, setHiddenNotes] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(HIDDEN_NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const { client, isLoading: isXmtpLoading } = useXMTP();
  const { address } = useAccount();

  const parseMessage = (message: DecodedMessage): ParsedNote | null => {
    try {
      const parsed = JSON.parse(message.content);
      return {
        id: message.id,
        content: parsed.content,
        metadata: {
          ...DEFAULT_NOTE_METADATA,
          ...parsed.metadata
        },
        senderAddress: message.senderAddress,
        sent: message.sent
      };
    } catch (e) {
      console.warn('Failed to parse message:', e);
      return null;
    }
  };

  const hideNote = (noteId: string) => {
    const newHiddenNotes = [...hiddenNotes, noteId];
    setHiddenNotes(newHiddenNotes);
    localStorage.setItem(HIDDEN_NOTES_KEY, JSON.stringify(newHiddenNotes));
  };

  const fetchNotes = async () => {
    if (!client || !address) return;

    try {
      setIsLoading(true);

      // Get all conversations
      const conversations = await client.conversations.list();
      
      // Fetch messages from all conversations
      const allMessages = await Promise.all(
        conversations.map(conv => conv.messages())
      );

      // Combine, parse, and sort all messages
      const combinedMessages = allMessages
        .flat()
        .map(parseMessage)
        .filter((note): note is ParsedNote => 
          note !== null && !hiddenNotes.includes(note.id)
        )
        .sort((a, b) => b.sent.getTime() - a.sent.getTime());

      setNotes(combinedMessages);

      // Stream new messages from all conversations
      conversations.forEach(async (conv) => {
        const stream = await conv.streamMessages();
        for await (const message of stream) {
          const parsedNote = parseMessage(message);
          if (parsedNote && !hiddenNotes.includes(parsedNote.id)) {
            setNotes(prev => [parsedNote, ...prev.filter(n => n.id !== parsedNote.id)]);
          }
        }
      });
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchNotes
  }));

  useEffect(() => {
    if (!isXmtpLoading && client) {
      fetchNotes();
    }
  }, [client, address, isXmtpLoading, hiddenNotes]);

  const getFilteredAndSortedNotes = () => {
    let filteredNotes = [...notes];

    // Apply search filter
    if (props.searchQuery) {
      const query = props.searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.content.toLowerCase().includes(query) ||
        formatAddress(note.senderAddress).toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (props.sortBy) {
      case 'oldest':
        filteredNotes.sort((a, b) => a.sent.getTime() - b.sent.getTime());
        break;
      case 'color':
        filteredNotes.sort((a, b) => a.metadata.color.localeCompare(b.metadata.color));
        break;
      case 'size':
        const sizeOrder = { small: 0, medium: 1, large: 2 };
        filteredNotes.sort((a, b) => sizeOrder[a.metadata.size] - sizeOrder[b.metadata.size]);
        break;
      default: // 'newest'
        filteredNotes.sort((a, b) => b.sent.getTime() - a.sent.getTime());
    }

    return filteredNotes;
  };

  if (isXmtpLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }

  const filteredNotes = getFilteredAndSortedNotes();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-100">Your Notes</h2>
        <span className="text-sm text-gray-400">{notes.length} notes</span>
      </div>
      
      {filteredNotes.length === 0 ? (
        <div className="text-center py-8 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
          <svg
            className="mx-auto h-12 w-12 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-100">No notes found</h3>
          <p className="mt-1 text-sm text-gray-400">
            {props.searchQuery ? 'Try adjusting your search query.' : 'Get started by creating a new note.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              style={{
                backgroundColor: note.metadata?.color || DEFAULT_NOTE_METADATA.color,
                height: SIZES[note.metadata?.size || DEFAULT_NOTE_METADATA.size].height,
                touchAction: 'manipulation'
              }}
              className="relative group rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col transform hover:-translate-y-1 active:scale-95"
            >
              <div className="absolute top-2 right-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => hideNote(note.id)}
                  className="p-2 bg-[#1a1a1a] rounded-full shadow-lg hover:bg-[#2a2a2a] active:transform active:scale-95 transition-all touch-manipulation"
                  title="Delete note"
                >
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2a2a2a] text-gray-100 truncate max-w-[150px]">
                      From: {formatAddress(note.senderAddress)}
                    </span>
                  </div>
                  <time className="text-xs text-gray-900 whitespace-nowrap">{formatDate(note.sent)}</time>
                </div>
                <p className="text-gray-900 whitespace-pre-wrap flex-1 text-sm sm:text-base overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-transparent">{note.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

NotesList.displayName = 'NotesList'; 