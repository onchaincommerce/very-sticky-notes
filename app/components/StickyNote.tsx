'use client';

import { useState } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import { useAccount } from 'wagmi';

interface NoteMetadata {
  color: string;
  size: 'small' | 'medium' | 'large';
}

interface StickyNoteProps {
  initialContent?: string;
  initialMetadata?: NoteMetadata;
  isEditing?: boolean;
  onSave?: () => void;
}

const DEFAULT_METADATA: NoteMetadata = {
  color: '#ffd43b',
  size: 'medium'
};

const SIZES = {
  small: { height: '150px', width: '200px' },
  medium: { height: '200px', width: '300px' },
  large: { height: '300px', width: '400px' }
};

const COLOR_OPTIONS = [
  { label: 'Yellow', value: '#ffd43b' },
  { label: 'Pink', value: '#ff8787' },
  { label: 'Blue', value: '#74c0fc' },
  { label: 'Green', value: '#69db7c' },
  { label: 'Purple', value: '#da77f2' },
];

export function StickyNote({ 
  initialContent = '', 
  initialMetadata = DEFAULT_METADATA,
  isEditing = true,
  onSave 
}: StickyNoteProps) {
  const [content, setContent] = useState(initialContent);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<NoteMetadata>(initialMetadata);
  const { client, isLoading: isXmtpLoading } = useXMTP();
  const { address } = useAccount();

  const validateAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const saveNote = async () => {
    if (!client || !address || !content.trim() || isXmtpLoading) return;
    if (!recipientAddress || !validateAddress(recipientAddress)) {
      setError('Please enter a valid recipient address');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      // Start a conversation with the recipient
      const conversation = await client.conversations.newConversation(recipientAddress);
      
      // Send the note with metadata
      const messageContent = JSON.stringify({
        content,
        metadata
      });
      
      await conversation.send(messageContent);
      
      // Clear the form
      setContent('');
      setRecipientAddress('');
      setMetadata(DEFAULT_METADATA);
      
      // Notify parent to refresh notes list
      onSave?.();
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to send note. Make sure the recipient has enabled XMTP.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    const style = {
      backgroundColor: metadata.color,
      ...SIZES[metadata.size]
    };

    return (
      <div className="bg-[#1a1a1a] rounded-lg shadow-md p-4 border border-[#2a2a2a]" style={style}>
        <p className="text-gray-100 whitespace-pre-wrap">{content}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg shadow-md p-6 space-y-4 border border-[#2a2a2a]">
      <div>
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-100">
          Recipient Address
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            id="recipient"
            type="text"
            value={recipientAddress}
            onChange={(e) => {
              setRecipientAddress(e.target.value);
              setError(null);
            }}
            placeholder="Enter ETH address (0x...)"
            className="block w-full rounded-md border-[#2a2a2a] bg-[#0a0a0a] text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-100">Note Color</label>
          <div className="mt-1 flex space-x-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={() => setMetadata(prev => ({ ...prev, color: color.value }))}
                className={`w-8 h-8 rounded-full border-2 ${
                  metadata.color === color.value ? 'border-green-500' : 'border-[#2a2a2a]'
                } hover:border-green-400 transition-colors`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-100">Note Size</label>
          <select
            value={metadata.size}
            onChange={(e) => setMetadata(prev => ({ ...prev, size: e.target.value as NoteMetadata['size'] }))}
            className="mt-1 block w-full rounded-md border-[#2a2a2a] bg-[#0a0a0a] text-gray-100 focus:border-green-500 focus:ring-green-500 sm:text-sm"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-100">
          Note Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note here..."
          style={{ backgroundColor: metadata.color }}
          rows={metadata.size === 'small' ? 3 : metadata.size === 'medium' ? 4 : 6}
          className="mt-1 block w-full rounded-md border-[#2a2a2a] text-gray-900 placeholder-gray-600 focus:border-green-500 focus:ring-green-500 sm:text-sm"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-900/50 border border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => {
            setContent('');
            setRecipientAddress('');
            setMetadata(DEFAULT_METADATA);
            onSave?.();
          }}
          className="inline-flex items-center px-4 py-2 border border-[#2a2a2a] text-sm font-medium rounded-md text-gray-100 bg-[#1a1a1a] hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Cancel
        </button>
        <button
          onClick={saveNote}
          disabled={isSaving || !content.trim() || isXmtpLoading || !recipientAddress}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Note
            </>
          )}
        </button>
      </div>
    </div>
  );
} 