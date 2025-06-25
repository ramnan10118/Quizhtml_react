'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import QRCode from 'qrcode';

interface SharePanelProps {
  joinPath: string;
  title: string;
  description: string;
}

export function SharePanel({ joinPath, title, description }: SharePanelProps) {
  const [activeTab, setActiveTab] = useState<'qr' | 'link'>('qr');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${joinPath}`;
      setJoinUrl(fullUrl);

      // Generate QR Code
      QRCode.toDataURL(fullUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#000000'
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

  return (
    <Card className="bg-white/10 backdrop-blur border-white/20">
      <CardHeader>
        <CardTitle className="text-white text-lg">{title}</CardTitle>
        <p className="text-slate-300 text-sm">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'qr'
                ? 'bg-white/20 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📱 QR Code
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'link'
                ? 'bg-white/20 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔗 Link
          </button>
        </div>

        {/* QR Code Tab */}
        {activeTab === 'qr' && (
          <div className="text-center space-y-4">
            {qrCodeUrl && (
              <div className="bg-white rounded-lg p-4 inline-block">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
            <p className="text-slate-300 text-sm">
              Participants can scan this QR code to join instantly
            </p>
          </div>
        )}

        {/* Link Tab */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-slate-400 text-xs mb-2">Join Link:</p>
              <code className="text-cyan-300 text-sm break-all">{joinUrl}</code>
            </div>
            <Button
              onClick={copyToClipboard}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </Button>
            <p className="text-slate-300 text-sm text-center">
              Share this link with participants to let them join
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}