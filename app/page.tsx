'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';
import { XMTPProvider } from './contexts/XMTPContext';
import { StickyNote } from './components/StickyNote';
import { NotesList, NotesListRef } from './components/NotesList';
import { useRef, useState } from 'react';

export default function Page() {
  const { isConnected } = useAccount();
  const notesListRef = useRef<NotesListRef>(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-green-500 truncate">Very Sticky</h1>
              <span className="text-sm text-gray-400 hidden sm:inline">notes</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full sm:w-64 px-4 py-2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                <svg
                  className="absolute right-3 h-5 w-5 text-gray-500 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <Wallet>
                <ConnectWallet>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8" />
                    <Name className="hidden sm:block" />
                  </div>
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name />
                    <Address />
                    <EthBalance />
                  </Identity>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isConnected ? (
        <XMTPProvider>
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              {/* Organization Controls */}
              <div className="mb-4 flex justify-between items-center sticky top-16 pt-2 pb-4 bg-[#0a0a0a] z-40">
                <select
                  className="rounded-full border-[#2a2a2a] bg-[#1a1a1a] text-gray-100 py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-manipulation"
                  value={sortBy}
                  onChange={handleSortChange}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="color">Group by Color</option>
                  <option value="size">Group by Size</option>
                </select>
                <button
                  onClick={() => setShowNewNote(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-black bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 touch-manipulation shadow-lg active:transform active:scale-95 transition-all"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  New Note
                </button>
              </div>

              {/* New Note Form */}
              {showNewNote && (
                <div className="mb-4">
                  <StickyNote
                    onSave={() => {
                      setShowNewNote(false);
                      notesListRef.current?.fetchNotes();
                    }}
                  />
                </div>
              )}

              {/* Notes List */}
              <NotesList 
                ref={notesListRef} 
                searchQuery={searchQuery}
                sortBy={sortBy}
              />
            </div>
          </div>
        </XMTPProvider>
      ) : (
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-100 sm:text-4xl">
              Welcome to Very Sticky Notes
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Connect your wallet to start creating and viewing your notes.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
