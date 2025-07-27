// Central Component Registry - Single source of truth for all UI components

// Core Components
export { Button, buttonVariants, type ButtonProps } from './Button'
export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from './Card'
export { Input, type InputProps } from './Input'
export { Label } from './label'

// Layout & Navigation
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog'

// Feedback Components
export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from './toast'
export { Alert, AlertTitle, AlertDescription } from './alert'
export { Badge, badgeVariants, type BadgeProps } from './badge'
export { Toaster } from './toaster'

// Layout Components
export { Separator } from './separator'

// Legacy components (maintained for compatibility)
export { SharePanel } from './SharePanel'

// Component Variants and Utilities
export { cn } from '@/lib/utils'

// Theme Configuration
export const UI_CONFIG = {
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  }
} as const

// Custom variants for quiz-specific components
export const QUIZ_VARIANTS = {
  buzzer: {
    size: 'buzz' as const,
    variant: 'buzz' as const,
  },
  primary: {
    variant: 'default' as const,
  },
  secondary: {
    variant: 'secondary' as const,
  },
  danger: {
    variant: 'destructive' as const,
  },
  ghost: {
    variant: 'ghost' as const,
  },
  outline: {
    variant: 'outline' as const,
  }
} as const

// Type exports for component composition
export type { VariantProps } from 'class-variance-authority'
export type ComponentVariant = typeof QUIZ_VARIANTS[keyof typeof QUIZ_VARIANTS]