# Testing & Debugging React

## Câu hỏi mở đầu

```jsx
// Bạn viết component 500 lines
function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ... 200 lines logic

  // Refactor thành 5 components nhỏ
  // → Test từng component riêng lẻ
  // → KHÔNG CẦN refactor tất cả cùng lúc
```

Bạn refactor component lớn thành nhỏ và muốn verify nó vẫn hoạt động. Hoặc bạn có bug production và cần reproduce trong môi trường test.

**Câu hỏi: Test cái gì, bằng cách nào, và khi nào?**

---

## 1. Testing Pyramid — Chi Tiết

### Tầng Testing

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                          ▲ E2E                                │
│                        ▲▲▲▲▲▲▲                             │
│                      ▲▲▲ Integration                       │
│                    ▲▲▲▲▲▲▲▲▲▲▲▲▲                         │
│                  ▲▲▲▲▲▲▲▲▲▲▲▲▲ Unit                      │
│                ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲                   │
│                                                              │
│  QUANTITY: Many unit tests, few integration, fewer E2E       │
│  SPEED:    Unit (ms) → Integration (100ms) → E2E (s)       │
│  SCOPE:   Unit (tiny) → Integration (medium) → E2E (full)  │
└──────────────────────────────────────────────────────────────┘
```

### Khi Nào Dùng Cái Nào

```
UNIT TESTS:
  ✓ Custom hooks (useDebounce, useAuth)
  ✓ Utility functions (formatDate, isEmail)
  ✓ Pure components (rendering logic)
  ✓ Reducers, business logic
  Speed: ~1-10ms per test
  Coverage target: 70-80%

INTEGRATION TESTS:
  ✓ Component + child components
  ✓ User interactions (click → state change)
  ✓ Form submissions
  ✓ API calls (mocked)
  Speed: ~100-500ms per test
  Coverage target: focus on critical paths

E2E TESTS (Playwright/Cypress):
  ✓ Critical user flows (login, checkout)
  ✓ Smoke tests
  ✓ Regression tests for bugs
  Speed: ~1-30s per test
  Coverage target: 5-10 critical flows
```

---

## 2. Unit Testing — React Testing Library

### Setup

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Component Testing Cơ Bản

```typescript
// components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  // ─── Rendering ───
  it('renders with label', () => {
    render(<Button label="Click me" />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button label="Primary" variant="primary" />);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');

    rerender(<Button label="Danger" variant="danger" />);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });

  it('renders in disabled state', () => {
    render(<Button label="Disabled" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders loading spinner when loading', () => {
    render(<Button label="Loading" loading />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Button interactions', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button label="Disabled" disabled onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn();
    render(<Button label="Loading" loading onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

### Query Priority — Testing Library

```typescript
// ĐÚNG: Query theo accessible role (recommended)
// 1. getByRole — accessibility-first
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });
screen.getByRole('heading', { level: 1 });
screen.getByRole('alert');

// 2. getByLabelText — form fields
screen.getByLabelText(/email address/i);

// 3. getByPlaceholderText — input với placeholder
screen.getByPlaceholderText(/your name/i);

// 4. getByText — non-interactive elements
screen.getByText(/no results found/i);

// 5. getByTestId — last resort
screen.getByTestId('custom-element');

// ❌ SAI: Query by class/id/element (fragile)
screen.getByClassName('btn-primary');
screen.getById('submit-btn');
screen.getByTagName('button');
```

---

## 3. Testing Custom Hooks

### renderHook

```typescript
// hooks/useCounter.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(3));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(3);
  });

  it('respects max value', () => {
    const { result } = renderHook(() => useCounter(0, { max: 5 }));

    act(() => {
      for (let i = 0; i < 10; i++) result.current.increment();
    });

    expect(result.current.count).toBe(5);
  });
});
```

### Testing Async Hooks

```typescript
// hooks/useUser.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from './useUser';

// Mock API
const mockFetchUser = vi.fn();
vi.mock('@/features/users/api/usersApi', () => ({
  fetchUser: (...args: unknown[]) => mockFetchUser(...args),
}));

describe('useUser', () => {
  it('fetches user data', async () => {
    const mockUser = { id: '1', name: 'Alice', email: 'alice@example.com' };
    mockFetchUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useUser('1'));

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('handles error', async () => {
    mockFetchUser.mockRejectedValueOnce(new Error('User not found'));

    const { result } = renderHook(() => useUser('999'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });
});
```

### Testing Debounced Hook

```typescript
// hooks/useDebounce.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('debounces value change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 500 } }
    );

    // Change value
    rerender({ value: 'world', delay: 500 });

    // Immediately: still 'hello'
    expect(result.current).toBe('hello');

    // After 500ms: changes to 'world'
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('world');
  });

  it('resets timer on value change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    rerender({ value: 'b', delay: 500 }); // t=0
    act(() => vi.advanceTimersByTime(300)); // t=300
    rerender({ value: 'c', delay: 500 }); // t=300, timer reset

    act(() => vi.advanceTimersByTime(300)); // t=600
    expect(result.current).toBe('a'); // Still 'a', timer was at 200ms when reset

    act(() => vi.advanceTimersByTime(200)); // t=800
    expect(result.current).toBe('c');
  });
});
```

---

## 4. Mocking — Chi Tiết

### Mock Functions

```typescript
// Mock một module
vi.mock('@/lib/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Hoặc mock function cụ thể
const mockGet = vi.fn();
vi.mocked(apiClient.get).mockImplementation(mockGet);
```

### Mocking fetch/axios

```typescript
// Mock global fetch
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

it('fetches data', async () => {
  const mockData = { id: 1, name: 'Alice' };
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(mockData),
  });

  render(<UserProfile id="1" />);

  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

### Spy On Object Methods

```typescript
it('calls console.log', () => {
  const consoleSpy = vi.spyOn(console, 'log');

  render(<Component />);

  expect(consoleSpy).toHaveBeenCalledWith('Component mounted');
});
```

### Module Mocking Toàn Phần

```typescript
// __mocks__/lodash.ts
export const debounce = vi.fn((fn) => fn);
export const cloneDeep = vi.fn((obj) => obj);

// Trong test
vi.mock('lodash');
```

---

## 5. Integration Testing

### Testing User Flow

```typescript
// features/auth/__tests__/LoginForm.integration.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../components/LoginForm';
import * as authApi from '../api/authApi';

// Mock API
vi.mock('../api/authApi');
const mockedAuthApi = vi.mocked(authApi);

describe('LoginForm Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    mockedAuthApi.login.mockResolvedValueOnce({
      token: 'fake-token',
      user: { id: '1', name: 'Alice' },
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockedAuthApi.login).toHaveBeenCalledWith({
        email: 'alice@example.com',
        password: 'password123',
      });
    });
  });

  it('shows validation errors for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows error on failed login', async () => {
    const user = userEvent.setup();
    mockedAuthApi.login.mockRejectedValueOnce(
      new ApiError('Invalid credentials', 401)
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i);
    });
  });
});
```

### Testing Component With Context

```typescript
// Test component dùng AuthContext
import { AuthProvider } from '@/features/auth/components/AuthProvider';

const renderWithAuth = (ui: ReactElement, options?: RenderOptions) => {
  return render(ui, { wrapper: ({ children }) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  ), ...options });
};

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    const mockUser = { id: '1', name: 'Alice' };

    vi.spyOn(auth, 'useAuth').mockReturnValue({
      user: mockUser,
      isLoading: false,
    });

    renderWithAuth(
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects when not authenticated', () => {
    vi.spyOn(auth, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
    });

    renderWithAuth(
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });
});
```

---

## 6. Snapshot Testing — Khi Nào Dùng

### Khi Nào DùNG

```
DÙNG SNAPSHOT KHI:
  ✓ Stable UI components (Button, Badge, Card variants)
  ✓ Không muốn test implementation details
  ✓ Component có nhiều states (loading, error, empty, data)
  ✓ Regression detection cho UI structure

KHÔNG DÙNG SNAPSHOT KHI:
  ✗ Dynamic content (timestamps, random values)
  ✗ Components thay đổi thường xuyên
  ✗ Complex nested components (hard to review)
  ✗ Business logic
```

### Snapshot Test

```typescript
// components/Badge.test.tsx.snap
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('matches snapshot for success variant', () => {
    const { container } = render(<Badge variant="success">Active</Badge>);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for danger variant', () => {
    const { container } = render(<Badge variant="danger">Error</Badge>);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for warning variant', () => {
    const { container } = render(<Badge variant="warning">Pending</Badge>);
    expect(container).toMatchSnapshot();
  });
});

// Snapshot file (auto-generated):
// __snapshots__/Badge.test.tsx.snap
exports[`Badge > matches snapshot for success variant 1`] = `
<div
  class="badge badge-success"
>
  Active
</div>
`;
```

---

## 7. Error Boundary Testing

```typescript
// shared/components/feedback/ErrorBoundary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Test component throws
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders fallback when error occurs', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('allows retry', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getByRole } = render(
      <ErrorBoundary fallback={<button>Retry</button>}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    fireEvent.click(getByRole('button', { name: 'Retry' }));

    // ErrorBoundary resets
    expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });
});
```

---

## 8. React DevTools Debugging

### Components Tab

```
React DevTools → Components tab:
  ├── Component tree visualization
  ├── Props/State display
  ├── Hooks state (hooks values)
  └── Search/filter components

DEBUGGING:
  1. Find component: Cmd+P / Ctrl+P → type name
  2. View props: right panel
  3. Trace why re-render: React DevTools → Highlight updates
  4. Record: Components → Settings → Highlight updates when components render
```

### Profiler Tab

```
React DevTools → Profiler tab:
  1. Click Record
  2. Interact with app
  3. Click Stop
  4. Analyze flamegraph

FLAMEGRAPH READS:
  ├── Wide bar = slow render
  ├── Yellow = component rendered
  └── White = not recorded

RANKED CHART:
  └── Components sorted by render time
  └── Identify biggest offenders

FILTERING:
  ├── Filter by component name
  └── Focus on specific user action

BUNDLE (React 18+):
  └── Profiler measures React runtime cost
  └── Does NOT measure DOM operations
```

### Common Debugging Workflows

```typescript
// 1. Debug: Why did this component re-render?
// → DevTools → Components → Settings → Highlight updates
// → Click button → See which components flash
// → Check if props change (reference equality)

// 2. Debug: State not updating?
// → DevTools → Components → Inspect component
// → View current state value
// → Check if setter was called (check Console)

// 3. Debug: Memory leak?
// → DevTools → Components → Record → Interact → Stop
// → Look for increasing memory (Timings column)
```

---

## 9. Testing Async — waitFor & findBy

```typescript
// waitFor: chờ assertion pass (retry until timeout)
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// findBy: auto-wait cho async elements
// Thay vì:
const spinner = screen.queryByRole('status'); // null!
await waitFor(() => {
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

// Dùng:
const spinner = await screen.findByRole('status'); // auto-wait
expect(spinner).toBeInTheDocument();

// Multiple queries
const [heading, paragraph] = await Promise.all([
  screen.findByRole('heading'),
  screen.findByText(/lorem ipsum/i),
]);
```

### Testing Suspense & Lazy

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { lazy, LazyExoticComponent } from 'react';

const LazyComponent = lazy(() => Promise.resolve({ default: () => <div>Lazy loaded</div> }));

describe('Lazy components', () => {
  it('renders with Suspense', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </Suspense>
    );

    // Initially shows fallback
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // After lazy loads
    await waitFor(() => {
      expect(screen.getByText('Lazy loaded')).toBeInTheDocument();
    });
  });
});
```

---

## 10. Coverage

### Coverage Reports

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/test/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
```

### Coverage Interpretation

```
COVERAGE METRICS:
  ├── lines:   % of code lines executed
  ├── branches:% of if/else branches taken
  ├── functions:% of functions called
  └── statements:% of statements executed

COVERAGE TARGETS:
  ├── 80-100%: critical libraries, payment logic
  ├── 70-80%:  business logic, complex functions
  └── 50-70%:  UI components, simple render functions

⚠️ HIGH COVERAGE ≠ GOOD TESTS
   Test quality matters more than percentage.
   70% coverage với meaningful tests >> 100% với weak tests.
```

---

## 11. E2E Testing — Playwright

### Setup

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('successful login', async ({ page }) => {
    await page.getByLabel(/email/i).fill('alice@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome, Alice')).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.getByLabel(/email/i).fill('alice@example.com');
    await page.getByLabel(/password/i).fill('wrong');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toHaveText(/invalid credentials/i);
  });

  test('loading state during submission', async ({ page }) => {
    await page.getByLabel(/email/i).fill('alice@example.com');
    await page.getByLabel(/password/i).fill('password123');

    const button = page.getByRole('button', { name: /sign in/i });
    await button.click();

    await expect(button).toBeDisabled();
    await expect(page.getByRole('status')).toBeVisible();
  });
});
```

---

## 12. Các Traps Phổ Biến

### ❌ Trap 1: Test Implementation Details

```typescript
// ❌ BAD: test internal state
const { result } = renderHook(() => useCounter());
result.current.increment();
expect(result.current.internalTimer).toBeTruthy(); // ❌ Implementation detail

// ✅ GOOD: test behavior
expect(result.current.count).toBe(1);
```

### ❌ Trap 2: Snapshot Cho Dynamic Content

```typescript
// ❌ BAD: snapshot with timestamp
it('matches snapshot', () => {
  render(<Timestamp date={new Date()} />);
  expect(container).toMatchSnapshot(); // ❌ Fails every run!
});

// ✅ GOOD: mock dynamic values
it('renders correctly', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01'));

  render(<Timestamp date={new Date()} />);
  expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();

  vi.useRealTimers();
});
```

### ❌ Trap 3: Không Cleanup Sau Test

```typescript
// ❌ BAD: subscription không cleanup
it('subscribes to events', () => {
  const addListener = vi.spyOn(eventBus, 'addListener');
  render(<EventListener />);

  // ❌ addListener không được gọi lại cleanup
});

// ✅ GOOD: cleanup trong unmount
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
```

### ❌ Trap 4: Testing-Library Query Sai

```typescript
// ❌ BAD: query by element/tag
screen.getByTagName('button');
screen.getByClassName('btn');

// ✅ GOOD: query by accessible role
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });
```

### ❌ Trap 5: Mocking Quá Nhiều

```typescript
// ❌ BAD: mock quá nhiều → test không còn realistic
vi.mock('@/lib/api/client', () => ({
  get: vi.fn().mockResolvedValue({ data: [] }),
  post: vi.fn().mockResolvedValue({ success: true }),
  put: vi.fn().mockResolvedValue({ success: true }),
  delete: vi.fn().mockResolvedValue({ success: true }),
}));

// ✅ GOOD: mock chỉ external dependencies
// API client internals không cần mock — dùng MSW hoặc mock server
```

---

## 13. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  TESTING — DECISION GUIDE                                     │
│                                                               │
│  WHAT TO TEST:                                               │
│  ├── Unit: custom hooks, utils, reducers, pure components   │
│  ├── Integration: user flows, forms, component trees        │
│  └── E2E: critical paths (login, checkout, core features)   │
│                                                               │
│  TESTING LIBRARY QUERIES (by priority):                     │
│  ├── 1. getByRole — accessible (button, heading, alert)   │
│  ├── 2. getByLabelText — form fields                       │
│  ├── 3. getByPlaceholderText — inputs                      │
│  ├── 4. getByText — non-interactive text                   │
│  └── 5. getByTestId — last resort                           │
│                                                               │
│  CUSTOM HOOK TESTING:                                       │
│  ├── renderHook from @testing-library/react                 │
│  ├── act() to trigger state changes                        │
│  ├── waitFor() for async assertions                        │
│  └── vi.useFakeTimers() for time-based hooks               │
│                                                               │
│  MOCKING:                                                   │
│  ├── vi.fn() — mock functions                              │
│  ├── vi.mock() — mock modules                              │
│  ├── vi.spyOn() — spy on existing functions               │
│  └── vi.mocked() — TypeScript type inference                │
│                                                               │
│  COVERAGE TARGETS:                                          │
│  ├── 70-80% lines — business logic                       │
│  ├── 50-70% — UI components                               │
│  └── HIGH coverage ≠ good tests                            │
│                                                               │
│  DEVTOOLS DEBUGGING:                                        │
│  ├── Components tab: inspect props/state                   │
│  ├── Profiler tab: measure render performance               │
│  └── Highlight updates: trace re-renders                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 14. Câu Hỏi Phỏng Vấn

### Q1: Testing Pyramid là gì?

**Trả lời:** Testing Pyramid = model phân bổ test theo tầng. Base (Unit): nhiều nhất, test nhanh nhất (~ms), scope nhỏ. Middle (Integration): ít hơn, test interactions giữa units. Top (E2E): ít nhất, test chậm nhất (~s), scope toàn bộ app. Lợi ích: feedback nhanh (unit), bảo vệ critical flows (E2E). Nguyên tắc: nhiều unit tests vì chúng isolate bugs tốt nhất, E2E ít vì chậm và fragile.

### Q2: Testing Library queries — priority như thế nào?

**Trả lời:** Testing Library khuyến khích query theo accessibility ( cái user thực sự perceive). Priority: (1) `getByRole` — accessible elements (button, heading, textbox); (2) `getByLabelText` — form fields; (3) `getByPlaceholderText`; (4) `getByText`; (5) `getByTestId` — last resort khi không có semantic. Không query by className, ID, tag — vì chúng là implementation details, dễ break khi refactor.

### Q3: Mock function là gì và khi nào dùng?

**Trả lời:** Mock = test double thay thế real function/object để control test environment. Dùng khi: (1) module phụ thuộc external (API calls, localStorage); (2) function có side effects (console.log); (3) cần control timing (setTimeout, fetch). `vi.fn()` tạo mock function, có thể configure: `.mockReturnValue()`, `.mockResolvedValue()`, `.mockImplementation()`. `vi.spyOn()` wraps existing function để track calls.

### Q4: Snapshot testing — khi nào dùng?

**Trả lời:** Dùng snapshot cho: stable UI components (Button variants, Badge, Card), regression detection khi component có nhiều visual states. Không dùng cho: dynamic content (timestamps), components thay đổi thường xuyên, complex nested components (review snapshot khó). Snapshot = serialize rendered output → compare với saved snapshot. Fail khi output khác.

### Q5: React DevTools debug re-render như thế nào?

**Trả lời:** Components tab: search component, view props/state/hooks values. Profiler tab: record renders → flamegraph. Highlight Updates: Settings → check "Highlight updates when components render" → click/trigger → components that re-render flash yellow. Ranked chart: components sorted by total render time. Đọc flamegraph: wider bar = slower render, yellow = component rendered. Profiler đo React runtime cost, không đo DOM operations.

---

## 15. Thực Hành

### Bài 1: Unit Test Custom Hook

```typescript
// hooks/useToggle.ts
// Test:
// 1. Initial value
// 2. Toggle changes value
// 3. Optional callback onChange

// Bonus: test useLocalStorage với vi.useFakeTimers()
```

### Bài 2: Integration Test Form

```typescript
// Test LoginForm:
// 1. Valid email + password → submit success
// 2. Invalid email → validation error
// 3. Empty fields → validation error
// 4. API error → error message displayed
// 5. Loading state → button disabled

// Mock authApi với vi.mock()
```

### Bài 3: Debug Với DevTools

```typescript
// 1. Tạo component với intentional bug (stale closure)
// 2. DevTools → Highlight updates → observe re-renders
// 3. Profiler → record → identify bottleneck
// 4. Fix bug
// 5. Verify fix với DevTools
```

---

## Checklist

- [ ] Unit tests cho custom hooks, utils, reducers
- [ ] Integration tests cho forms, user interactions
- [ ] E2E tests cho critical flows (login, core features)
- [ ] Testing Library queries: role → label → text → testId (priority)
- [ ] `renderHook` cho custom hook testing
- [ ] `act()` cho state changes, `waitFor()` cho async
- [ ] `vi.fn()`, `vi.mock()`, `vi.spyOn()` cho mocking
- [ ] `vi.useFakeTimers()` cho time-based hooks
- [ ] Snapshot cho stable UI components, KHÔNG cho dynamic content
- [ ] ErrorBoundary test với vi.spyOn(console, 'error')
- [ ] React DevTools Profiler: measure trước khi fix
- [ ] Coverage: 70-80% lines cho business logic
- [ ] `afterEach` cleanup: `vi.clearAllMocks()`, `vi.restoreAllMocks()`
- [ ] KHÔNG test implementation details
- [ ] KHÔNG mock internal functions (mock external dependencies)

---

*Last updated: 2026-04-01*
