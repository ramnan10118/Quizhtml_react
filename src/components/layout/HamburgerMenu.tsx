'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ConnectionStatus as ConnectionStatusType } from '@/types/quiz';

interface HamburgerMenuProps {
  connectionStatus?: ConnectionStatusType;
  isRegistered?: boolean;
  onQuitSession?: () => void;
  teamScores?: { name: string; score: number }[];
  className?: string;
}

export function HamburgerMenu({ 
  connectionStatus,
  isRegistered = false,
  onQuitSession,
  teamScores = [],
  className 
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleQuitSession = () => {
    if (onQuitSession) {
      onQuitSession();
    }
    setIsOpen(false);
  };

  return (
    <div className={cn('relative z-50', className)}>
      {/* Hamburger Button */}
      <Button
        onClick={toggleMenu}
        variant="ghost"
        size="icon"
        className="relative w-10 h-10 p-0 hover:bg-gray-100 dark:hover:bg-dark-700"
        aria-label="Menu"
      >
        <div className="w-5 h-5 flex flex-col justify-center items-center space-y-1">
          <span
            className={cn(
              'block w-4 h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300 origin-center',
              isOpen && 'rotate-45 translate-y-1'
            )}
          />
          <span
            className={cn(
              'block w-4 h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300',
              isOpen && 'opacity-0'
            )}
          />
          <span
            className={cn(
              'block w-4 h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300 origin-center',
              isOpen && '-rotate-45 -translate-y-1'
            )}
          />
        </div>
      </Button>

      {/* Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-in Menu */}
      <div
        className={cn(
          'fixed top-0 right-0 h-screen w-80 bg-white dark:bg-dark-800 shadow-2xl z-50',
          'transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-dark-600',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Menu
            </h2>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="w-8 h-8 p-0"
            >
              <span className="text-xl text-gray-500 dark:text-gray-400">×</span>
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Connection Status Section */}
              {connectionStatus && (
                <div>
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {connectionStatus.connectionMessage}
                    </span>
                  </div>
                </div>
              )}

              {/* Team Scores Section */}
              {teamScores.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Team Scores
                  </h3>
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="space-y-3">
                      {teamScores
                        .sort((a, b) => b.score - a.score)
                        .map((team, index) => (
                          <div
                            key={team.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                #{index + 1}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {team.name}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {team.score}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quit Session Button - Bottom */}
            {isRegistered && onQuitSession && (
              <div className="pt-4 border-t border-gray-200 dark:border-dark-600">
                <Button
                  onClick={handleQuitSession}
                  variant="destructive"
                  size="sm"
                  className="text-sm"
                >
                  Quit Session
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}