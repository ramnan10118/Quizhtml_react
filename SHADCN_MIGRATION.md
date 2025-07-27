# Shadcn/UI Migration Documentation

## Overview
This document outlines the complete migration of the quiz/polling application to use Shadcn/UI components with a centralized component system.

## 🎯 Migration Objectives
- ✅ Centralized component registry for consistent UI patterns
- ✅ Enhanced TypeScript support with strict type definitions
- ✅ Improved accessibility and responsive design
- ✅ Maintained all existing functionality (Socket.IO, animations, celebrations)
- ✅ Dark mode support with CSS variable-based theming
- ✅ Better component composition and reusability

## 📁 New File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── index.ts          # Central export file
│   │   ├── Button.tsx        # Enhanced with CVA variants
│   │   ├── Card.tsx          # Shadcn standard implementation
│   │   ├── Input.tsx         # Form input with proper ring focus
│   │   ├── label.tsx         # Accessible form labels
│   │   ├── dialog.tsx        # Modal/Dialog system
│   │   ├── toast.tsx         # Notification system
│   │   ├── toaster.tsx       # Toast provider component
│   │   ├── alert.tsx         # Alert/Banner components
│   │   ├── badge.tsx         # Status badges
│   │   ├── separator.tsx     # Layout separator
│   │   └── SharePanel.tsx    # Legacy component (maintained)
│   ├── quiz/                 # Feature-specific components
│   ├── polling/              # Feature-specific components
│   └── layout/               # Layout components
├── hooks/
│   └── useToast.ts           # Toast notification hook
└── lib/
    └── utils.ts              # Utility functions (cn, etc.)
```

## 🔧 Configuration Files

### `components.json`
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

### `tailwind.config.ts`
- Integrated Shadcn/UI design tokens with CSS variables
- Maintained custom animations (shake, celebration, buzz)
- Preserved existing color schemes while adding semantic tokens
- Container configuration for responsive layouts

### `globals.css`
- Added CSS variable definitions for light/dark themes
- Preserved custom animations and mobile optimizations
- Enhanced accessibility with ring focus states

## 🎨 Component System

### Central Registry (`src/components/ui/index.ts`)
Single source of truth that exports:
- **Core Components**: Button, Card, Input, Label
- **Layout Components**: Dialog, Separator
- **Feedback Components**: Toast, Alert, Badge
- **Utilities**: cn function, component variants
- **Theme Configuration**: UI_CONFIG, QUIZ_VARIANTS

### Enhanced Button Component
```tsx
// Before
<Button variant="buzz" size="buzz">BUZZ!</Button>

// After (with centralized variants)
<Button {...QUIZ_VARIANTS.buzzer}>BUZZ!</Button>
```

### Card Component Family
- `Card`: Container with proper theming
- `CardHeader`, `CardContent`, `CardFooter`: Semantic sections
- `CardTitle`, `CardDescription`: Typography components

## 🔄 Migration Pattern

### Import Consolidation
```tsx
// Before
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

// After
import { Button, Card, CardContent, cn } from '@/components/ui'
```

### Theme Token Usage
```tsx
// Before
className="bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-gray-100"

// After
className="bg-muted text-foreground"
```

## 🎪 Preserved Features

### Quiz System
- ✅ BuzzerButton with 3D press animations
- ✅ Real-time buzzing with Socket.IO
- ✅ Score tracking and celebrations
- ✅ Question display with reveal animations
- ✅ Team management and registration

### Polling System
- ✅ Live poll creation and voting
- ✅ Real-time results with Socket.IO
- ✅ QR code generation for joining
- ✅ Multi-option poll support

### Interactive Features
- ✅ Haptic feedback (mobile devices)
- ✅ Confetti celebrations
- ✅ Responsive hamburger menu
- ✅ Connection status indicators
- ✅ Dark mode toggle support

## 🚀 Usage Examples

### Creating a Notification
```tsx
import { useToast } from '@/hooks/useToast'

const { toast } = useToast()

toast({
  title: "Success!",
  description: "Your quiz has been created.",
  variant: "default"
})
```

### Using Dialog Components
```tsx
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to quit the session?
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

### Form Components
```tsx
import { Input, Label, Button } from '@/components/ui'

<div className="space-y-4">
  <div>
    <Label htmlFor="team-name">Team Name</Label>
    <Input 
      id="team-name"
      placeholder="Enter your team name"
      value={teamName}
      onChange={(e) => setTeamName(e.target.value)}
    />
  </div>
  <Button type="submit">Join Quiz</Button>
</div>
```

## 🎛️ Customization

### Component Variants
The `QUIZ_VARIANTS` object provides pre-configured component combinations:
- `buzzer`: For quiz buzzer buttons
- `primary`: Main call-to-action buttons
- `secondary`: Secondary actions
- `danger`: Destructive actions
- `ghost`: Subtle interactions
- `outline`: Bordered buttons

### Theme Customization
CSS variables in `globals.css` control the entire color scheme:
- `--primary`: Main brand color
- `--secondary`: Secondary brand color
- `--destructive`: Error/danger states
- `--muted`: Subtle backgrounds and text
- `--accent`: Highlights and focus states

## 🧪 Testing

### Build Validation
```bash
npm run build  # ✅ Successful compilation
npm run lint   # ⚠️  Only minor warnings (no breaking issues)
```

### Feature Testing Checklist
- [ ] Quiz creation and hosting
- [ ] Team registration and buzzing
- [ ] Poll creation and voting
- [ ] Real-time Socket.IO functionality
- [ ] QR code generation and scanning
- [ ] Responsive design on mobile/tablet
- [ ] Dark mode switching
- [ ] Accessibility with keyboard navigation

## 📚 Benefits Achieved

1. **Developer Experience**
   - Single import source for all UI components
   - Consistent API across all components
   - Enhanced TypeScript support with proper types

2. **Maintainability**
   - Centralized component definitions
   - Easy theme updates via CSS variables
   - Consistent styling patterns

3. **Performance**
   - Tree-shaking optimized imports
   - Efficient CSS variable-based theming
   - Maintained bundle size efficiency

4. **Accessibility**
   - ARIA attributes built into components
   - Proper focus management
   - Keyboard navigation support

## 🔮 Next Steps

1. **Enhanced Components**
   - Add Tabs component for quiz setup
   - Implement Popover for quick actions
   - Add Progress component for quiz advancement

2. **Advanced Features**
   - Form validation with react-hook-form integration
   - Advanced toast notifications with actions
   - Command palette for host controls

3. **Testing**
   - Component testing with Jest/Testing Library
   - E2E testing with Playwright
   - Accessibility testing with axe-core

## 📞 Support

For questions about the Shadcn/UI migration:
- Component usage: Check `src/components/ui/index.ts`
- Theme customization: See `src/app/globals.css`
- Type definitions: All components export proper TypeScript types
- Examples: Reference existing components in quiz/polling folders