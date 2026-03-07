# AGENTS.md - Coding Guidelines for Triple J Auto Investment

## Project Overview
React 19 + TypeScript + Vite auto dealership application. Uses Supabase for backend, Tailwind CSS for styling, Framer Motion for animations.

## Build Commands

```bash
# Development
npm run dev              # Start dev server on port 3000

# Production
npm run build            # Build for production
npm run preview          # Preview production build
```

## Code Style Guidelines

### Imports
- Use single quotes for strings
- Group imports: React, third-party libraries, internal modules, types
- Use `@/` alias for root-relative imports
- Example:
```typescript
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../context/Store';
import { Vehicle, VehicleStatus } from '../types';
```

### TypeScript
- Use strict typing - avoid `any`
- Define interfaces in `types.ts`
- Use enums for fixed values (e.g., `VehicleStatus`)
- Use `interface` over `type` for object shapes
- PascalCase for types, interfaces, enums
- camelCase for variables, functions
- Prefix async functions with action verb (e.g., `fetchData`, `updateVehicle`)

### React Components
- Use functional components with hooks
- Export default at bottom of file
- Props interface named `{ComponentName}Props`
- Destructure props in parameter
- Use `React.FC` for component type explicitly when needed
```typescript
interface NavbarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isOpen, onToggle }) => {
  // Component body
};

export default Navbar;
```

### Naming Conventions
- Components: PascalCase (e.g., `VehicleCard`, `AdminDashboard`)
- Files: Match component name (e.g., `VehicleCard.tsx`)
- Hooks: camelCase starting with `use` (e.g., `useScrollLock`)
- Services: camelCase descriptive (e.g., `geminiService.ts`)
- Context: PascalCase with `Provider` suffix (e.g., `StoreProvider`)
- Database fields: snake_case (converted to camelCase in code)

### Error Handling
- Use try/catch for async operations
- Log errors with descriptive messages using emojis (❌, ⚠️, ✅)
- Show user-friendly alerts for critical failures
- Never expose sensitive data in error messages
```typescript
try {
  const { data, error } = await supabase.from('vehicles').select('*');
  if (error) {
    console.error('❌ Failed to load vehicles:', error);
    throw new Error('Database connection failed');
  }
} catch (error) {
  console.error('❌ Unexpected error:', error);
  setConnectionError('Failed to load data. Please try again.');
}
```

### Tailwind CSS
- Use utility-first approach
- Custom colors defined in `tailwind.config.js` (e.g., `tj-green`, `tj-gold`)
- Prefer responsive prefixes (`md:`, `lg:`) over breakpoints
- Use arbitrary values sparingly
- Group related classes together
```html
<div className="flex items-center justify-center bg-gray-900 text-white px-6 py-4">
```

### State Management
- Use React Context for global state
- Use `useState` for local component state
- Use `useEffect` with proper cleanup
- Use `useRef` for mutable values that don't trigger re-renders

### Animations
- Use Framer Motion for page transitions and micro-interactions
- Keep animations subtle and purposeful
- Use `AnimatePresence` for enter/exit animations
- Prefer `initial/animate/exit` props over variants for simple cases

### Database (Supabase)
- Use camelCase in TypeScript, snake_case in database
- Transform data when fetching/storing
- Use RLS policies for security
- Include `.select()` after mutations to verify success

### File Organization
```
project-root/
├── pages/              # Route components
│   └── admin/          # Admin-specific pages
├── components/         # Reusable UI components
├── context/            # React Context providers
├── services/           # External API services
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── utils/              # Helper functions
├── types.ts            # TypeScript type definitions
├── App.tsx             # Root component
└── index.tsx           # Entry point
```

### Environment Variables
- Use `VITE_` prefix for client-side env vars
- Access via `import.meta.env.VITE_*`
- Never commit `.env` files

### Git
- Write clear, concise commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issue numbers when applicable

### Security
- Validate all user inputs
- Sanitize data before displaying
- Use parameterized queries with Supabase
- Implement proper authentication checks
- Never expose API keys in client code

### Comments
- Use comments sparingly - prefer self-documenting code
- Use JSDoc for public functions
- Mark temporary fixes with `TODO:` or `FIXME:`
- Log messages should use emojis for visual scanning

### Testing (When Implemented)
```bash
# No test commands currently configured
# Tests should follow naming: *.test.ts or *.test.tsx
```
