# Scalable Folder Structure

## Câu hỏi mở đầu

Bạn bắt đầu project với 5 files. Sau 1 tháng: 50 files. Sau 6 tháng: 300 files.

```
src/
├── components/
│     ├── Button.js
│     ├── Button.js.save
│     ├── Button.new.js
│     ├── ButtonOld.js
│     ├── ButtonFinal.js
│     └── button.js
├── utils/
│     ├── helpers.js
│     ├── helpers2.js
│     ├── functions.js
│     └── index.js
├── api/
│     └── api.js (1000 lines)
└── ???
```

Bạn không biết:
- File nào còn dùng?
- Component nào đã deprecated?
- Feature mới thêm vào đâu?
- `utils.js` có gì trong đó?

**Đây là dấu hiệu cần scalable folder structure.**

---

## 1. Hai Phương Pháp Chính

### So Sánh

```
┌──────────────────────────────────────────────────────────────┐
│  LAYER-BASED (Type-based)                                    │
│  ├── components/     → tất cả UI components              │
│  ├── hooks/          → tất cả hooks                      │
│  ├── utils/          → tất cả functions                   │
│  ├── api/            → tất cả API calls                   │
│  └── types/          → tất cả TypeScript types            │
│                                                               │
│  → Tìm nhanh theo loại file                               │
│  → KHÔNG biết feature nào dùng gì                        │
│  → Prop drilling khi features cần share data             │
│  → Tốt cho: small projects (< 20 components)              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  FEATURE-BASED (Recommended)                                 │
│  ├── features/                                              │
│  │     ├── auth/                                           │
│  │     │     ├── components/  ← Login, Register, Password   │
│  │     │     ├── hooks/      ← useAuth, useLogin          │
│  │     │     ├── api/        ← authApi.ts                 │
│  │     │     ├── types/      ← AuthUser, LoginDto         │
│  │     │     └── index.ts    ← public API                 │
│  │     ├── dashboard/                                     │
│  │     └── posts/                                          │
│  ├── shared/                                               │
│  │     ├── components/  ← truly reusable: Button, Modal  │
│  │     ├── hooks/      ← useDebounce, useLocalStorage    │
│  │     └── utils/      ← formatDate, generateId          │
│  └── app/                                                  │
│        ├── providers.tsx                                    │
│        └── routes.tsx                                       │
│                                                               │
│  → Biết ngay feature nào có gì                            │
│  → Team có thể làm việc độc lập trên features             │
│  → Xoá feature = xoá thư mục                             │
│  → Tốt cho: medium to large projects (20+ components)    │
└──────────────────────────────────────────────────────────────┘
```

### Khi Nào Dùng Cái Nào

```
LAYER-BASED:
  • Project nhỏ (< 20 components)
  • Team nhỏ (1-2 dev)
  • Ít features, nhiều shared code
  • Prototype, POC

FEATURE-BASED:
  • Project vừa và lớn (20+ components)
  • Team từ 2+ dev
  • Multiple distinct features
  • Cần scale theo thời gian
```

---

## 2. Feature-Based Structure — Chi Tiết

### Cấu Trúc Hoàn Chỉnh

```
src/
│
├── features/                    ← Tất cả features
│   │
│   ├── auth/                    ← Feature: Authentication
│   │   ├── components/
│   │   │     ├── LoginForm.tsx
│   │   │     ├── RegisterForm.tsx
│   │   │     ├── PasswordResetForm.tsx
│   │   │     ├── AuthLayout.tsx
│   │   │     └── __tests__/
│   │   │           └── LoginForm.test.tsx
│   │   │
│   │   ├── hooks/
│   │   │     ├── useAuth.ts          ← useAuth() → { user, login, logout }
│   │   │     ├── useLogin.ts
│   │   │     └── usePermissions.ts
│   │   │
│   │   ├── api/
│   │   │     └── authApi.ts         ← login(), register(), refreshToken()
│   │   │
│   │   ├── types/
│   │   │     ├── AuthUser.ts
│   │   │     ├── LoginDto.ts
│   │   │     └── index.ts
│   │   │
│   │   ├── utils/
│   │   │     └── tokenStorage.ts    ← Chỉ auth mới dùng
│   │   │
│   │   ├── constants/
│   │   │     └── authRoutes.ts
│   │   │
│   │   └── index.ts                 ← PUBLIC API của feature
│   │        // export { useAuth } from './hooks/useAuth'
│   │        // export { LoginForm } from './components/LoginForm'
│   │
│   ├── dashboard/                  ← Feature: Dashboard
│   │   ├── components/
│   │   │     ├── DashboardLayout.tsx
│   │   │     ├── StatsCards.tsx
│   │   │     ├── ActivityChart.tsx
│   │   │     └── RecentActivity.tsx
│   │   ├── hooks/
│   │   │     ├── useDashboardData.ts
│   │   │     └── useStats.ts
│   │   ├── api/
│   │   │     └── dashboardApi.ts
│   │   └── index.ts
│   │
│   ├── posts/                     ← Feature: Blog Posts
│   │   ├── components/
│   │   │     ├── PostList.tsx
│   │   │     ├── PostEditor.tsx
│   │   │     ├── PostCard.tsx
│   │   │     ├── PostDetail.tsx
│   │   │     └── __tests__/
│   │   ├── hooks/
│   │   │     ├── usePosts.ts
│   │   │     ├── usePostEditor.ts
│   │   │     └── usePostSearch.ts
│   │   ├── api/
│   │   │     └── postsApi.ts
│   │   ├── types/
│   │   │     ├── Post.ts
│   │   │     ├── CreatePostDto.ts
│   │   │     └── index.ts
│   │   └── index.ts
│   │
│   └── settings/                  ← Feature: Settings
│       ├── components/
│       ├── hooks/
│       ├── api/
│       └── index.ts
│
├── shared/                        ← THỰC SỰ reusable
│   │
│   ├── components/               ← UI primitives (dùng mọi nơi)
│   │   ├── ui/
│   │   │     ├── Button.tsx
│   │   │     ├── Input.tsx
│   │   │     ├── Select.tsx
│   │   │     ├── Modal.tsx
│   │   │     ├── Dropdown.tsx
│   │   │     └── Badge.tsx
│   │   │
│   │   ├── layout/
│   │   │     ├── PageLayout.tsx
│   │   │     ├── Sidebar.tsx
│   │   │     ├── Header.tsx
│   │   │     └── Footer.tsx
│   │   │
│   │   ├── feedback/
│   │   │     ├── Toast.tsx
│   │   │     ├── Spinner.tsx
│   │   │     ├── Skeleton.tsx
│   │   │     ├── EmptyState.tsx
│   │   │     └── ErrorBoundary.tsx
│   │   │
│   │   └── index.ts
│   │
│   ├── hooks/                    ← Generic hooks (không phụ thuộc feature)
│   │     ├── useDebounce.ts
│   │     ├── useLocalStorage.ts
│   │     ├── usePrevious.ts
│   │     ├── useOnClickOutside.ts
│   │     ├── useMediaQuery.ts
│   │     ├── useWindowSize.ts
│   │     └── useAsync.ts
│   │
│   ├── utils/                    ← Pure functions
│   │     ├── format/
│   │     │     ├── formatDate.ts
│   │     │     ├── formatCurrency.ts
│   │     │     └── formatRelativeTime.ts
│   │     ├── validation/
│   │     │     ├── isEmail.ts
│   │     │     ├── isUrl.ts
│   │     │     └── isStrongPassword.ts
│   │     ├── formatDate.ts      ← Legacy (nên xoá sau khi restructure)
│   │     └── index.ts
│   │
│   ├── constants/
│   │     ├── colors.ts
│   │     ├── breakpoints.ts
│   │     └── api.ts
│   │
│   ├── types/                    ← Shared types
│   │     ├── api.ts             ← GenericResponse, ApiError
│   │     ├── pagination.ts      ← PaginatedResponse, PaginationParams
│   │     └── index.ts
│   │
│   └── lib/                     ← Third-party configs
│        ├── apiClient.ts        ← Axios/Fetch instance
│        └── queryClient.ts      ← React Query config
│
├── app/                          ← App-level setup
│   │
│   ├── providers/
│   │     ├── QueryProvider.tsx
│   │     ├── AuthProvider.tsx
│   │     └── index.ts
│   │
│   ├── routes/
│   │     ├── AppRoutes.tsx
│   │     ├── ProtectedRoute.tsx
│   │     └── paths.ts
│   │
│   ├── layouts/
│   │     ├── MainLayout.tsx
│   │     └── AuthLayout.tsx
│   │
│   └── entry.tsx
│
├── pages/                       ← Page components (entry points)
│   ├── HomePage.tsx
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   └── NotFoundPage.tsx
│
└── main.tsx                     ← Entry point
```

### Barrel Export (index.ts Mỗi Feature)

```typescript
// features/auth/index.ts
// ← ĐÂY LÀ PUBLIC API CỦA AUTH FEATURE

// Components
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { AuthLayout } from './components/AuthLayout';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useLogin } from './hooks/useLogin';
export { usePermissions } from './hooks/usePermissions';

// Types
export type { AuthUser } from './types/AuthUser';
export type { LoginDto } from './types/LoginDto';

// KHÔNG export internals:
// export { _internalHelper } from './utils/internal'  ← ❌
```

**Sử dụng bên ngoài feature:**
```typescript
// DashboardPage.tsx
import { useAuth } from '@/features/auth';    // ✅ Chỉ import từ index
import { Button } from '@/shared/components';  // ✅
```

---

## 3. Quy Tắc Đặt Tên

### Files

```
COMPONENTS:       PascalCase
  ├── Button.tsx
  ├── UserProfile.tsx
  ├── PostList.tsx
  └── AuthLayout.tsx

HOOKS:            camelCase, bắt đầu bằng "use"
  ├── useAuth.ts
  ├── usePosts.ts
  └── useDebounce.ts

UTILS/FUNCTIONS:  camelCase hoặc kebab-case
  ├── formatDate.ts
  ├── is-valid-email.ts
  └── generateId.ts

API:              camelCase hoặc kebab-case
  ├── authApi.ts
  ├── posts-api.ts
  └── userApi.ts

TYPES/INTERFACES: PascalCase
  ├── AuthUser.ts
  ├── Post.ts
  └── ApiResponse.ts

CONSTANTS:        camelCase hoặc SCREAMING_SNAKE_CASE
  ├── colors.ts
  ├── API_ROUTES.ts
  └── breakpoints.ts
```

### Folders

```
FOLDERS:          kebab-case hoặc camelCase (nhất quán)
  ├── auth/
  ├── dashboard/
  ├── user-profile/     ← kebab-case
  ├── postsApi/         ← camelCase
  └── shared/
```

### Imports

```
ABSOLUTE IMPORTS (khuyến nghị):
  import { useAuth } from '@/features/auth';
  import { Button } from '@/shared/components';
  import { formatDate } from '@/shared/utils';

RELATIVE IMPORTS (trong cùng feature):
  import { Button } from '@/shared/components';
  import { useAuth } from '../hooks/useAuth';
  import { LoginForm } from '../components/LoginForm';
```

---

## 4. Module Resolution Config

### TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/features/*": ["src/features/*"],
      "@/shared/*": ["src/shared/*"],
      "@/app/*": ["src/app/*"],
      "@/pages/*": ["src/pages/*"]
    }
  }
}
```

### Vite (vite.config.ts)

```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/app': path.resolve(__dirname, './src/app'),
    },
  },
});
```

---

## 5. Shared vs Features — Khi Nào Tách

### Quy Tắc Quyết Định

```
┌──────────────────────────────────────────────────────────────┐
│  ĐƯA VÀO FEATURE KHI:                                       │
│    • Chỉ feature này dùng                                  │
│    • Hoặc 1-2 features cùng domain dùng                     │
│    • Có thể refactor mà không ảnh hưởng features khác       │
│                                                               │
│  ĐƯA VÀO SHARED KHI:                                        │
│    • ≥ 3 features khác nhau dùng                          │
│    • Là UI primitive (Button, Modal, Input)                 │
│    • Là generic utility (formatDate, useDebounce)           │
│    • Là infrastructure (apiClient, queryClient)             │
└──────────────────────────────────────────────────────────────┘
```

### Ví dụ Quyết Định

```
Auth API (authApi.ts):
  → features/auth/api/authApi.ts  ✅ (chỉ auth dùng)

Post API (postsApi.ts):
  → features/posts/api/postsApi.ts  ✅ (chỉ posts dùng)

Generic API client:
  → shared/lib/apiClient.ts  ✅ (mọi feature dùng)

User avatar component (chỉ profile page):
  → features/profile/components/UserAvatar.tsx  ✅

Button component (mọi page dùng):
  → shared/components/ui/Button.tsx  ✅

useAuth hook:
  → features/auth/hooks/useAuth.ts  ✅ (auth feature owns it)

useDebounce (generic):
  → shared/hooks/useDebounce.ts  ✅
```

---

## 6. Colocating Supporting Files

### Testing

```
ĐẶT TEST CÙNG CHỖ VỚI FILE ĐƯỢC TEST:

features/auth/
├── components/
│     ├── LoginForm.tsx
│     ├── LoginForm.test.tsx      ← ✅ Cùng folder
│     └── __tests__/
│           └── LoginForm.e2e.test.tsx
│
├── hooks/
│     ├── useAuth.ts
│     └── useAuth.test.ts         ← ✅ Cùng folder
│
└── api/
      ├── authApi.ts
      └── authApi.test.ts          ← ✅ Cùng folder
```

### Stories (Storybook)

```
features/posts/
├── components/
│     ├── PostCard.tsx
│     ├── PostCard.stories.tsx    ← ✅ Cùng folder
│     └── __tests__/
│
└── hooks/
      ├── usePosts.ts
      └── usePosts.stories.tsx    ← ✅
```

### Styles (CSS Modules)

```
features/auth/
├── components/
│     ├── LoginForm.tsx
│     ├── LoginForm.module.css    ← ✅ CSS module cùng folder
│     └── RegisterForm.module.css
│
└── hooks/
      └── useAuth.module.css      ← ❌ Hook không có CSS!
```

---

## 7. Migration: Layer-Based → Feature-Based

### Bước 1: Map Hiện Tại

```
Trước khi migrate, list tất cả files hiện có:

src/
├── components/
│     ├── Button.js         → dùng ở: auth, dashboard, posts
│     ├── UserCard.js       → dùng ở: posts, comments, profile
│     ├── AuthForm.js       → dùng ở: auth ONLY
│     ├── PostList.js       → dùng ở: posts ONLY
│     └── Dashboard.js      → dùng ở: dashboard ONLY
│
├── hooks/
│     ├── useAuth.js       → dùng ở: auth, dashboard
│     ├── usePosts.js       → dùng ở: posts ONLY
│     └── useTheme.js      → dùng ở: everywhere
│
└── api/
      └── api.js (1000 lines) → auth + posts + dashboard
```

### Bước 2: Phân Loại Files

```
SHARED (di chuyển sang shared/):
  ├── Button, UserCard, Modal
  ├── useTheme, useDebounce
  └── apiClient (基础设施)

AUTH FEATURE:
  ├── AuthForm, LoginForm
  ├── useAuth
  └── authApi

POSTS FEATURE:
  ├── PostList, PostCard
  ├── usePosts
  └── postsApi

DASHBOARD FEATURE:
  ├── Dashboard
  ├── DashboardChart
  └── dashboardApi
```

### Bước 3: Thực Hiện Từ Từ

```
❌ KHÔNG migrate tất cả một lần
✅ Migrate từng feature một

1. Tạo structure mới:
   src/features/auth/index.ts  ← empty
   src/features/posts/index.ts ← empty

2. Migrate auth features trước:
   mv src/components/AuthForm.tsx src/features/auth/components/
   mv src/hooks/useAuth.ts src/features/auth/hooks/
   mv src/api/auth.ts src/features/auth/api/authApi.ts

3. Update imports trong auth features:
   // Before
   import { AuthForm } from '@/components/AuthForm';
   // After
   import { AuthForm } from '@/features/auth';

4. Test → deploy → next feature
```

---

## 8. Cấu Trúc Nâng Cao

### Với Monorepo

```
packages/
├── apps/
│   ├── web/                  ← React app
│   │     └── src/
│   │           ├── features/
│   │           └── shared/
│   └── admin/               ← Another React app
│         └── src/
│               ├── features/
│               └── shared/
│
└── packages/
      ├── ui/                ← Shared component library
      │     ├── src/
      │     │     ├── Button.tsx
      │     │     ├── Modal.tsx
      │     │     └── index.ts
      │     └── package.json
      │
      └── utils/             ← Shared utilities
            └── package.json
```

### Với React Query / TanStack Query

```
features/posts/
├── api/
│     ├── postsApi.ts         ← API definitions
│     └── postsQueries.ts     ← Query/mutation definitions
│
├── hooks/
│     ├── usePosts.ts        ← Wrapper: useQuery từ postsQueries
│     └── usePostEditor.ts
│
// TanStack Query convention:
// postsQueries.ts chứa queryKey + queryFn definitions
// hooks chỉ là wrapper đơn giản

export const postsQueries = {
  all: () => ['posts'] as const,
  lists: () => [...postsQueries.all(), 'list'] as const,
  list: (filters: PostFilters) => [...postsQueries.lists(), filters] as const,
  details: () => [...postsQueries.all(), 'detail'] as const,
  detail: (id: string) => [...postsQueries.details(), id] as const,
};

export function usePosts(filters: PostFilters) {
  return useQuery({
    queryKey: postsQueries.list(filters),
    queryFn: () => postsApi.getAll(filters),
  });
}
```

---

## 9. Các Traps Phổ Biến

### ❌ Trap 1: Shared Quá Rộng

```typescript
// ❌ shared/components chứa mọi thứ
shared/components/
  ├── AuthForm.tsx         ← ❌ Chỉ auth dùng → features/auth/
  ├── DashboardChart.tsx   ← ❌ Chỉ dashboard dùng → features/dashboard/
  ├── PostEditor.tsx       ← ❌ Chỉ posts dùng → features/posts/
  └── Button.tsx           ← ✅ Đúng chỗ
```

### ❌ Trap 2: Circular Imports

```typescript
// ❌ Circular: A → B → C → A
// features/auth/hooks/useAuth.ts
import { postsApi } from '@/features/posts/api';  // ❌ Auth không nên import Posts

// ✅
import { apiClient } from '@/shared/lib/apiClient';
```

### ❌ Trap 3: Re-export Quá Nhiều Từ index.ts

```typescript
// ❌ index.ts export mọi thứ
export { Button } from './components/Button';
export { Input } from './components/Input';
// → 50 exports → barrel file quá lớn → tree-shaking không hoạt động

// ✅ Chỉ export những gì public
export { Button, Input } from './components/ui';  // Sub-barrel
```

### ❌ Trap 4: Đặt Utils Trong Feature Nhưng Thực Sự Shared

```typescript
// features/auth/utils/tokenStorage.ts
// → features/posts cũng cần tokenStorage

// ❌ Copy-paste sang posts/utils/

// ✅
shared/utils/tokenStorage.ts  ← một lần, mọi nơi dùng
```

---

## 10. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  FOLDER STRUCTURE — DECISION GUIDE                           │
│                                                               │
│  SMALL PROJECT (< 20 components):                            │
│    └── Layer-based OK                                       │
│                                                               │
│  MEDIUM/LARGE PROJECT (20+ components):                      │
│    └── Feature-based BẮT BUỘC                             │
│                                                               │
│  FEATURE STRUCTURE:                                          │
│  ├── features/<name>/                                     │
│  │     ├── components/                                    │
│  │     ├── hooks/                                         │
│  │     ├── api/                                           │
│  │     ├── types/                                         │
│  │     ├── utils/                                         │
│  │     └── index.ts (PUBLIC API)                          │
│  │                                                         │
│  └── shared/                                              │
│        ├── components/ui/  (Button, Input, Modal)          │
│        ├── hooks/        (useDebounce, useLocalStorage)   │
│        ├── utils/        (formatDate, isEmail)            │
│        └── lib/          (apiClient, queryClient)         │
│                                                               │
│  RULES:                                                      │
│  ├── Features own their code                            │
│  ├── Shared = ≥ 3 features dùng                       │
│  ├── Test + Story cùng folder với file được test     │
│  ├── index.ts = barrel export = public API              │
│  └── Absolute imports với @/ alias                    │
│                                                               │
│  NAMING:                                                     │
│  ├── files:  PascalCase (Button.tsx)                    │
│  ├── hooks:  camelCase, use prefix (useAuth.ts)        │
│  └── folders: kebab-case (user-profile/)               │
│                                                               │
│  MIGRATION:                                                 │
│  └── Layer → Feature: từng feature một, test kỹ       │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Câu Hỏi Phỏng Vấn

### Q1: Phân biệt layer-based và feature-based structure?

**Trả lời:** Layer-based (type-based) nhóm files theo loại: `components/`, `hooks/`, `utils/`. Ưu điểm: tìm nhanh theo loại file. Nhược điểm: không biết file thuộc feature nào, khó scale khi project lớn. Feature-based nhóm files theo domain: `features/auth/`, `features/posts/`, mỗi feature chứa components, hooks, api, types riêng. Ưu điểm: team có thể làm việc độc lập, xoá feature = xoá thư mục, dễ hiểu domain. Nên dùng feature-based cho project 20+ components.

### Q2: Shared folder chứa gì?

**Trả lời:** Shared chứa code được ≥ 3 features khác nhau sử dụng: (1) UI primitives: Button, Input, Modal, Dropdown; (2) Generic hooks: useDebounce, useLocalStorage, usePrevious; (3) Pure utilities: formatDate, isEmail, generateId; (4) Infrastructure: apiClient, queryClient. KHÔNG đặt vào shared: components chỉ 1 feature dùng, utilities chỉ 1 feature dùng, feature-specific types.

### Q3: Barrel export (index.ts) là gì và tại sao dùng?

**Trả lời:** Barrel export = `index.ts` file export tất cả public API của một module/feature. `features/auth/index.ts` export `{ useAuth, LoginForm, AuthUser }` để consumer chỉ cần `import { useAuth } from '@/features/auth'` thay vì `import { useAuth } from '@/features/auth/hooks/useAuth'`. Lợi ích: clean imports, che giấu internal structure, dễ refactor internals. Nhược điểm: có thể làm tree-shaking kém nếu export quá nhiều → nên sub-barrel: `export { Button } from './ui'`.

### Q4: Khi nào dùng absolute imports?

**Trả lời:** Luôn dùng absolute imports với alias (`@/`) cho project từ vừa trở lên. Ví dụ: `import { Button } from '@/shared/components/ui'` thay vì `../../../../shared/components/ui`. Lợi ích: imports ngắn hơn, không phụ thuộc vào current file depth, refactoring (di chuyển file) không cần sửa import paths. Cấu hình: TypeScript `paths` + Vite `resolve.alias`.

### Q5: Migration từ layer-based sang feature-based như thế nào?

**Trả lời:** (1) Map tất cả files hiện có, xác định file dùng ở features nào; (2) Phân loại: shared vs feature-specific; (3) Migrate từng feature một, không migrate tất cả một lần; (4) Mỗi feature: tạo folder mới, di chuyển files, update imports, test kỹ, deploy; (5) Shared: sau khi tất cả features migrated → đưa truly shared code vào shared/. Quan trọng: không refactor + add feature cùng lúc.

---

## 12. Thực Hành

### Bài 1: Phân Loại Files

```typescript
// List files từ một project thật hoặc hypothetical:
// 1. Đọc code mỗi file
// 2. Xác định: features nào import nó?
// 3. Phân loại: shared hay feature-specific?

const files = [
  'components/Button.tsx',
  'components/UserAvatar.tsx',
  'components/PostEditor.tsx',
  'hooks/useAuth.ts',
  'hooks/usePosts.ts',
  'hooks/useTheme.ts',
  'utils/formatDate.ts',
  'api/api.ts',
];

// Output:
// shared: Button, useTheme, formatDate
// features/auth: useAuth
// features/posts: PostEditor, usePosts, UserAvatar
```

### Bài 2: Tạo Feature Structure

```typescript
// Tạo structure cho một feature mới "comments":
// Thư mục, files, index.ts exports

// Requirements:
// 1. Components: CommentList, CommentItem, CommentForm
// 2. Hooks: useComments, useCommentEditor
// 3. API: commentsApi
// 4. Types: Comment, CreateCommentDto
// 5. Barrel export (index.ts)
// 6. Mock test file

// Bonus: tạo shared/index.ts gồm Button, Input từ shadcn/ui
```

### Bài 3: Config Alias

```json
// Thêm vào tsconfig.json và vite.config.ts:
// paths alias @/ → src/

// Tạo tsconfig.json:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// Tạo vite.config.ts:
import path from 'path';
// resolve.alias: '@': path.resolve(__dirname, './src')
```

---

## Checklist

- [ ] Feature-based structure cho project vừa/lớn (20+ components)
- [ ] Layer-based OK cho project nhỏ
- [ ] `features/<name>/` chứa components, hooks, api, types, utils
- [ ] `index.ts` = barrel export = public API của feature
- [ ] `shared/` chỉ chứa code dùng ≥ 3 features
- [ ] Imports: `import { X } from '@/features/<name>'` (absolute)
- [ ] Config: TypeScript `paths` + Vite `resolve.alias`
- [ ] Test + Story cùng folder với file được test
- [ ] Migration: layer → feature, từng feature một
- [ ] Colocate supporting files (styles, tests) cùng feature

---

*Last updated: 2026-04-01*
