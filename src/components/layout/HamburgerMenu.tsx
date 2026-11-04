'use client'

import * as React from 'react'
import { LogOut, Menu, Trophy, X } from 'lucide-react'
import { Button, cn } from '@/components/ui'
import { ConnectionStatus as ConnectionStatusType } from '@/types/quiz'
import { ConnectionStatus } from './ConnectionStatus'

const { useState } = React

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
      <Button
        onClick={toggleMenu}
        variant="ghost"
        size="icon"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-screen w-80 max-w-[85vw] border-l border-border bg-card shadow-raised',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Menu</h2>
            <Button onClick={() => setIsOpen(false)} variant="ghost" size="icon-sm" aria-label="Close menu">
              <X />
            </Button>
          </div>

          <div className="flex flex-1 flex-col justify-between">
            <div className="space-y-6">
              {connectionStatus && <ConnectionStatus status={connectionStatus} />}

              {teamScores.length > 0 && (
                <div>
                  <h3 className="eyebrow mb-3 flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5" /> Team scores
                  </h3>
                  <div className="divide-y divide-border rounded-lg border border-border bg-surface-raised">
                    {teamScores
                      .sort((a, b) => b.score - a.score)
                      .map((team, index) => (
                        <div key={team.name} className="flex items-center justify-between px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="w-5 text-xs font-semibold text-muted-foreground tabular">#{index + 1}</span>
                            <span className="text-sm font-medium text-foreground">{team.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-primary tabular">{team.score}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {isRegistered && onQuitSession && (
              <div className="border-t border-border pt-4">
                <Button onClick={handleQuitSession} variant="destructive" size="sm" className="w-full">
                  <LogOut /> Quit session
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
