import { useCallback } from 'react';

export interface HapticFeedback {
  buttonPress: () => void;
  success: () => void;
  error: () => void;
  buzz: () => void;
  connectionChange: () => void;
}

export function useHapticFeedback(): HapticFeedback {
  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const buttonPress = useCallback(() => {
    vibrate(50);
  }, [vibrate]);

  const success = useCallback(() => {
    vibrate([50, 50, 50]);
  }, [vibrate]);

  const error = useCallback(() => {
    vibrate(150);
  }, [vibrate]);

  const buzz = useCallback(() => {
    vibrate([100, 50, 100]);
  }, [vibrate]);

  const connectionChange = useCallback(() => {
    vibrate(75);
  }, [vibrate]);

  return {
    buttonPress,
    success,
    error,
    buzz,
    connectionChange,
  };
}