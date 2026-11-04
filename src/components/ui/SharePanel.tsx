'use client';

import React, { useState, useEffect } from 'react';
import { Check, Copy, Link2, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { Button } from './Button';
import { SegmentedControl } from './SegmentedControl';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

interface SharePanelProps {
  joinPath: string;
  title: string;
  description: string;
  className?: string;
}

export function SharePanel({ joinPath, title, description, className }: SharePanelProps) {
  const [activeTab, setActiveTab] = useState<'qr' | 'link'>('qr');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${joinPath}`;
      setJoinUrl(fullUrl);

      // Generate QR Code (dark modules on white so any phone camera reads it)
      QRCode.toDataURL(fullUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0a0e1a',
          light: '#ffffff'
        }
      }).then(url => {
        setQrCodeUrl(url);
      });
    }
  }, [joinPath]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const sessionCode = (() => {
    try {
      const url = new URL(joinUrl);
      return url.searchParams.get('session');
    } catch {
      return null;
    }
  })();

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          size="sm"
          aria-label="Share method"
          options={[
            { value: 'qr', label: 'QR code', icon: <QrCode /> },
            { value: 'link', label: 'Link', icon: <Link2 /> },
          ]}
        />

        {activeTab === 'qr' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-xl border border-border bg-white p-3 shadow-card">
              {qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCodeUrl} alt="QR code to join" className="h-40 w-40" width={160} height={160} />
              ) : (
                <div className="h-40 w-40 animate-pulse rounded-md bg-muted" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">Point a phone camera at the code to join instantly.</p>
          </div>
        )}

        {activeTab === 'link' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-surface-raised p-3">
              <p className="eyebrow mb-1.5">Join link</p>
              <code className="block break-all font-mono text-xs leading-relaxed text-foreground">{joinUrl || '…'}</code>
            </div>
            <Button onClick={copyToClipboard} variant={copied ? 'success' : 'outline'} className="w-full" disabled={!joinUrl}>
              {copied ? <Check /> : <Copy />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        )}

        {sessionCode && (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2">
            <span className="eyebrow">Session</span>
            <code className="font-mono text-xs text-muted-foreground truncate max-w-[60%]" title={sessionCode}>
              {sessionCode}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
