# DingleUP! Frontend

React + Vite + TypeScript Progressive Web App for the DingleUP! quiz game.

## 🎨 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Routing**: React Router v6
- **PWA**: Workbox + vite-plugin-pwa
- **Payments**: Stripe Elements
- **Backend**: Supabase client
- **Mobile**: Capacitor (iOS/Android)

## 📦 Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Environment Variables

Create `.env` file with:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

### Development

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:8080
```

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Development build (with sourcemaps)
npm run build:dev
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── game/           # Game-specific components
│   ├── lootbox/        # Lootbox UI components
│   ├── admin/          # Admin panel components
│   └── ...
├── pages/              # Route pages
│   ├── Dashboard.tsx
│   ├── Game.tsx
│   ├── Leaderboard.tsx
│   ├── Profile.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useWallet.ts
│   ├── useGameState.ts
│   ├── useLootbox.ts
│   └── ...
├── stores/             # Zustand stores
│   ├── audioStore.ts
│   └── walletStore.ts
├── lib/                # Utilities
│   ├── utils.ts
│   ├── analytics.ts
│   └── ...
├── i18n/               # Internationalization
│   ├── translations/
│   └── useI18n.ts
├── integrations/       # External integrations
│   └── supabase/
│       ├── client.ts
│       └── types.ts
└── assets/             # Static assets
```

## 🎮 Key Features

### Authentication

Username + PIN authentication (no email required):

```tsx
import { supabase } from '@/integrations/supabase/client';

// Register
const { data, error } = await supabase.functions.invoke('register-with-username-pin', {
  body: { username, pin, dateOfBirth }
});

// Login
const { data, error } = await supabase.functions.invoke('login-with-username-pin', {
  body: { username, pin }
});
```

### Game Flow

```tsx
import { useGameState } from '@/hooks/useGameState';

function Game() {
  const {
    currentQuestion,
    currentQuestionIndex,
    handleAnswer,
    isLoading
  } = useGameState();

  return (
    <div>
      <QuestionCard question={currentQuestion} onAnswer={handleAnswer} />
    </div>
  );
}
```

### Wallet Management

```tsx
import { useWallet } from '@/hooks/useWallet';

function Dashboard() {
  const { data: wallet, refetch } = useWallet();
  
  return (
    <div>
      <p>Gold: {wallet?.coins}</p>
      <p>Lives: {wallet?.lives}</p>
    </div>
  );
}
```

### Real-time Updates

```tsx
import { supabase } from '@/integrations/supabase/client';

useEffect(() => {
  const channel = supabase
    .channel('wallet-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`
    }, (payload) => {
      refetchWallet();
    })
    .subscribe();

  return () => { channel.unsubscribe(); };
}, [userId]);
```

### Payments (Stripe)

```tsx
import { useMobilePayment } from '@/hooks/useMobilePayment';

function Shop() {
  const { handlePayment, isProcessing } = useMobilePayment();

  const buyLootbox = async () => {
    await handlePayment({
      amount: 1.99,
      productId: 'lootbox_1',
      productType: 'lootbox',
      quantity: 1
    });
  };

  return <button onClick={buyLootbox}>Buy Lootbox</button>;
}
```

## 📱 PWA Features

### Service Worker

Automatically configured via `vite-plugin-pwa`:

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    runtimeCaching: [
      // Cache strategies for assets
    ]
  }
})
```

### Offline Support

- Critical assets pre-cached
- Runtime caching for images, videos, audio
- Offline fallback page

### Install Prompt

```tsx
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

function InstallButton() {
  const { promptInstall, isInstallable } = useInstallPrompt();
  
  if (!isInstallable) return null;
  
  return <button onClick={promptInstall}>Install App</button>;
}
```

## 🎨 Theming

### Design System

All colors use semantic tokens from `index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}
```

### Usage

```tsx
// ✅ Use semantic tokens
<div className="bg-background text-foreground">

// ❌ Don't use direct colors
<div className="bg-white text-black">
```

## 🌍 Internationalization

### Using Translations

```tsx
import { useI18n } from '@/i18n/useI18n';

function MyComponent() {
  const { t, lang } = useI18n();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <p>Current language: {lang}</p>
    </div>
  );
}
```

### Adding Translations

Edit translation files in `src/i18n/translations/`:

```typescript
// hu.ts
export default {
  dashboard: {
    welcome: 'Üdvözöllek!'
  }
};

// en.ts
export default {
  dashboard: {
    welcome: 'Welcome!'
  }
};
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📊 Analytics

Built-in analytics tracking:

```tsx
import { trackEvent } from '@/lib/analytics';

trackEvent('game_completed', {
  correct_answers: 12,
  total_questions: 15
});
```

## 🔒 Security

- Content Security Policy (CSP) headers
- XSS protection
- Input sanitization
- JWT token management
- Secure storage (encrypted localStorage)

## 📱 Mobile Build (Capacitor)

### iOS

```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

### Android

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

## 🚀 Deployment

### Static Hosting (Vercel, Netlify)

```bash
npm run build
# Upload dist/ folder to hosting provider
```

### Docker

```dockerfile
# Use production Dockerfile
docker build -f ../infra/Dockerfile.frontend -t dingleup-frontend .
docker run -p 3000:80 dingleup-frontend
```

### Environment-specific Builds

```bash
# Production (minified, no sourcemaps)
npm run build

# Development (with sourcemaps)
npm run build:dev
```

## 🎯 Performance

- Code splitting by route
- Lazy loading for admin pages
- Image optimization (80% quality)
- PWA caching strategies
- Vendor chunk splitting
- CDN-ready assets

### Lighthouse Scores

- Performance: 95+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100
- PWA: 100

## 🐛 Debugging

### Console Logging

```typescript
// Production builds strip console.log
if (import.meta.env.DEV) {
  console.log('Debug info');
}
```

### React DevTools

Install browser extension for React debugging.

### Network Inspection

Use browser DevTools Network tab to inspect Supabase API calls.

## 📦 Dependencies

### Core

- `react`, `react-dom` - UI framework
- `react-router-dom` - Routing
- `@tanstack/react-query` - Server state
- `zustand` - Client state
- `@supabase/supabase-js` - Backend client

### UI

- `@radix-ui/*` - Headless UI components
- `tailwindcss` - Styling
- `lucide-react` - Icons
- `vaul` - Drawer component
- `sonner` - Toast notifications

### Utilities

- `date-fns` - Date formatting
- `zod` - Schema validation
- `clsx` - Class name utilities

## 🔗 Useful Links

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Supabase Client](https://supabase.com/docs/reference/javascript)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
