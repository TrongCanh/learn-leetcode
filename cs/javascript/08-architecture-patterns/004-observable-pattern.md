# Observable & Reactive — Khi Data Thay Đổi, Code Tự Chạy

## Câu hỏi mở đầu

```javascript
// Tại sao đoạn code này "lạ"?

const value = 0;
const doubled = value * 2; // computed once

value = 5;
console.log(doubled); // 0 — outdated!

// doubled không "react" khi value thay đổi!
// Nhưng bạn MUỐN nó tự cập nhật...
```

**Reactive programming** giải quyết vấn đề này: khi data thay đổi, dependent computations tự động chạy lại. `doubled` sẽ = 10 khi `value` = 5, không cần bạn gọi lại. Bài này dạy bạn nền tảng của reactive programming — từ custom Observable đến RxJS — giúp bạn hiểu cách Angular, Vue, React hooks, và MobX thực sự hoạt động.

---

## 1. Observable Pattern — Nền Tảng Của Reactive

### Observable là gì?

```
┌──────────────────────────────────────────────────────────────┐
│  OBSERVABLE PATTERN                                            │
│                                                               │
│  Producer (Observable)                                        │
│  │    │  │  │                                                 │
│  │    ▼  ▼  ▼                                                 │
│  │  emit emit emit                                           │
│  │    │  │  │                                                 │
│  │    ▼  ▼  ▼                                                 │
│  Consumer (Observer)                                          │
│                                                               │
│  Data Flow: Producer →→→ Observer                              │
│  Observer đăng ký (subscribe) → nhận notifications          │
│  Producer emit giá trị mới → Observer nhận được              │
└──────────────────────────────────────────────────────────────┘
```

### Custom Observable

```javascript
// Observable = object có thể subscribe, unsubscribe, notify

class Observable {
  constructor() {
    this.observers = new Set();
  }

  subscribe(observer) {
    this.observers.add(observer);
    // Return unsubscribe function
    return () => this.observers.delete(observer);
  }

  // Notify all observers
  emit(value) {
    this.observers.forEach(observer => observer(value));
  }

  // Clear all
  unsubscribe() {
    this.observers.clear();
  }
}

// Usage:
const clicks = new Observable();

const unsub = clicks.subscribe(count => {
  console.log('Button clicked! Count:', count);
});

button.addEventListener('click', () => clicks.emit(count++));
unsub(); // unsubscribe
```

### Observable với Object

```javascript
// Observable object — tự động notify khi property thay đổi
class ObservableObject {
  constructor(initialState = {}) {
    this.state = initialState;
    this.observers = new Set();
  }

  // Subscribe to ALL changes
  subscribe(observer) {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  // Subscribe to SPECIFIC key
  subscribeToKey(key, observer) {
    const wrapper = (state) => observer(state[key]);
    this.observers.add(wrapper);
    return () => this.observers.delete(wrapper);
  }

  // Set value + notify
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Only notify if value actually changed
    if (oldValue !== value) {
      this.observers.forEach(fn => fn(this.state));
    }
  }

  get(key) {
    return this.state[key];
  }
}

// Usage:
const store = new ObservableObject({ count: 0, name: 'Alice' });

store.subscribe(state => {
  console.log('Store updated:', state);
});

store.set('count', 1);   // notify
store.set('count', 1);   // no notify (same value)
store.set('name', 'Bob'); // notify

// Subscribe to specific key:
store.subscribeToKey('count', count => {
  console.log('Count changed to:', count);
});

store.set('count', 5); // logs "Store updated" + "Count changed to: 5"
```

---

## 2. From Callback Hell To Observable

### Callback problem

```javascript
// ❌ Callback hell — pyramid of doom
fetchUser(userId, (err, user) => {
  if (err) return handleError(err);
  fetchPosts(user.id, (err, posts) => {
    if (err) return handleError(err);
    fetchComments(posts[0].id, (err, comments) => {
      if (err) return handleError(err);
      render(user, posts, comments);
    });
  });
});

// ❌ Race conditions
// Nếu request nào return trước, kết quả có thể KHÔNG theo thứ tự

// ❌ Memory leak
button.addEventListener('click', handler); // never removed!
```

### Observable solution

```javascript
// ✅ Observable chains — flat, readable
fromEvent(button, 'click')        // Observable
  .pipe(
    debounceTime(300),           // wait 300ms after last click
    switchMap(() => fetchUser(id)), // cancel previous if new click
    switchMap(user => fetchPosts(user.id)),
    switchMap(posts => fetchComments(posts[0].id)),
    catchError(err => of(handleError(err)))
  )
  .subscribe(result => render(result));

// ✅ Cancellation — observable tự cancel request cũ khi có request mới
// ✅ Error handling — catchError operator
// ✅ Cleanup — unsubscribe khi component destroy
```

---

## 3. RxJS Core Concepts

### Observable vs Subject

```
┌──────────────────────────────────────────────────────────────┐
│  OBSERVABLE vs SUBJECT                                         │
│                                                               │
│  Observable: cold, unicast (1 subscriber = 1 producer copy) │
│  ├── Lazy: không làm gì cho đến khi subscribe                │
│  ├── Unicast: mỗi subscriber nhận GIÁ TRỊ RIÊNG              │
│  └── Hot? Không — producer tạo mới mỗi subscribe            │
│                                                               │
│  Subject: hot, multicast (tất cả subscribers cùng 1 producer)│
│  ├── Active: có thể emit trước khi subscribe                │
│  ├── Multicast: tất cả subscribers nhận CÙNG giá trị        │
│  └── Variants: BehaviorSubject, ReplaySubject, AsyncSubject   │
└──────────────────────────────────────────────────────────────┘
```

```javascript
// Observable — cold, unicast
const obs$ = new Observable(observer => {
  console.log('Producer started');
  setTimeout(() => observer.next('A'), 100);
  setTimeout(() => observer.next('B'), 200);
  setTimeout(() => observer.complete(), 300);
});

obs$.subscribe(v => console.log('Sub1:', v));
// Output: Producer started, Sub1: A, Sub1: B

obs$.subscribe(v => console.log('Sub2:', v));
// Output: Producer started, Sub2: A, Sub2: B
// → Mỗi subscribe = producer CHẠY LẠI!

// Subject — hot, multicast
const subject = new Subject();

subject.subscribe(v => console.log('Sub1:', v));
subject.subscribe(v => console.log('Sub2:', v));

subject.next('A');
subject.next('B');
// Output: Sub1: A, Sub2: A, Sub1: B, Sub2: B
// → Cùng producer cho tất cả subscribers
// → Subject emit TRƯỚC subscribe: Sub2 KHÔNG nhận 'A'
```

### Subject variants

```javascript
// BehaviorSubject: replay giá trị CUỐI cho subscriber mới
const behavior = new BehaviorSubject('initial');

behavior.subscribe(v => console.log('Sub1:', v)); // 'Sub1: initial'
behavior.next('A');

behavior.subscribe(v => console.log('Sub2:', v)); // 'Sub2: A' — nhận giá trị hiện tại!
behavior.next('B');

// Use case: state management (Vuex, NgRx dùng BehaviorSubject)
// → Component subscribe lúc mount → nhận state HIỆN TẠI ngay

// ReplaySubject: replay N giá trị CUỐI cho subscriber mới
const replay = new ReplaySubject(3); // replay 3 giá trị

replay.next('A');
replay.next('B');
replay.next('C');
replay.next('D');

replay.subscribe(v => console.log('Sub:', v)); // 'Sub: B, C, D' — replay 3 cuối
// replay 3, nhận B C D (không nhận A)

// AsyncSubject: chỉ replay GIÁ TRỊ CUỐI khi complete
const asyncSubj = new AsyncSubject();

asyncSubj.next('A');
asyncSubj.next('B');
asyncSubj.subscribe(v => console.log('Sub:', v)); // không output
asyncSubj.next('C');
asyncSubj.complete(); // chỉ khi complete mới emit giá trị cuối
// Output: 'Sub: C'
// Use case: caching, chỉ quan tâm result cuối cùng
```

---

## 4. RxJS Operators

### Marble diagrams (text-based visualization)

```javascript
// Marble notation:
// --- = time (each dash = time unit)
// a,b,c = emitted values
// |    = complete
// #    = error
// ()   = multiple values in same time unit

// source:  ---a---b---c---|
// map(x => x.toUpperCase()):
//         ---A---B---C---|

// filter(x => x !== 'b'):
//         ---a-------c---|

// debounceTime(300):
//         ---a-------c|
//         (b ignored if followed by c within 300ms)
```

### Transformation operators

```javascript
import { fromEvent, interval, of } from 'rxjs';
import { map, filter, reduce, scan, switchMap, mergeMap, concatMap } from 'rxjs';

// map: transform each value
of(1, 2, 3).pipe(
  map(n => n * 2)
).subscribe(v => console.log(v)); // 2, 4, 6

// filter: only pass values matching condition
of(1, 2, 3, 4, 5).pipe(
  filter(n => n % 2 === 0)
).subscribe(v => console.log(v)); // 2, 4

// reduce vs scan
of(1, 2, 3).pipe(
  reduce((acc, val) => acc + val, 0) // emit 1 lần
).subscribe(v => console.log(v)); // 6

of(1, 2, 3).pipe(
  scan((acc, val) => acc + val, 0) // emit MỖI LẦN
).subscribe(v => console.log(v)); // 1, 3, 6
// scan = running total, dùng cho state management
```

### Flattening operators — Khi nào dùng cái nào?

```javascript
// ⚠️ Observable trong Observable = nested Observable
// Flattening operators flatten nested Observable thành flat Observable

// switchMap: cancel previous, keep only latest
// Dùng cho: search, auto-complete (chỉ giữ request mới nhất)
fromEvent(searchInput, 'input').pipe(
  map(e => e.target.value),
  filter(text => text.length > 2),
  debounceTime(300),
  switchMap(text => http.get(`/search?q=${text}`)) // cancel previous
).subscribe(results => render(results));
// User type quickly → only LAST request result is shown

// concatMap: queue, execute in order
// Dùng cho: form submissions, sequential API calls
of(1, 2, 3).pipe(
  concatMap(id => http.post('/api/process', { id }))
).subscribe(result => console.log(result));
// Request 1 → wait → Request 2 → wait → Request 3
// → ORDER GUARANTEED

// mergeMap: run all in parallel
// Dùng cho: parallel fetches, non-dependent operations
of(1, 2, 3).pipe(
  mergeMap(id => http.get(`/api/user/${id}`), 3) // max 3 concurrent
).subscribe(user => console.log(user));
// Request 1, 2, 3 → all at once (max 3)
// → FASTER but order NOT guaranteed

// exhaustMap: ignore new while processing
// Dùng cho: prevent double-submit
fromEvent(submitButton, 'click').pipe(
  exhaustMap(() => http.post('/api/submit', formData)) // ignore clicks while processing
).subscribe(result => console.log(result));
// Click → submit starts → clicks ignored → submit ends → new click accepted
```

### Combination operators

```javascript
import { combineLatest, forkJoin, withLatestFrom, merge } from 'rxjs';

// combineLatest: kết hợp latest values từ multiple observables
const temperature$ = new BehaviorSubject(25);
const humidity$ = new BehaviorSubject(60);

combineLatest([temperature$, humidity$]).subscribe(([temp, hum]) => {
  console.log(`Temp: ${temp}°C, Humidity: ${hum}%`);
});

temperature$.next(26);   // Temp: 26°C, Humidity: 60%
humidity$.next(65);      // Temp: 26°C, Humidity: 65%
// → Both must emit at least once before combineLatest fires

// forkJoin: đợi TẤT CẢ complete, lấy final values
forkJoin([
  http.get('/api/users'),
  http.get('/api/config')
]).subscribe(([users, config]) => {
  console.log(users, config);
});
// → Chờ cả 2 complete, lấy result cuối cùng

// merge: combine multiple streams into one
const clicks$ = fromEvent(button, 'click');
const moves$ = fromEvent(document, 'mousemove');

merge(clicks$, moves$).subscribe(event => {
  console.log(event.type); // 'click' or 'mousemove'
});

// withLatestFrom: lấy latest từ another stream (không emit primary)
const search$ = fromEvent(input, 'input').pipe(
  debounceTime(300),
  map(e => e.target.value)
);

const suggestions$ = fromEvent(button, 'click').pipe(
  withLatestFrom(search$),
  map(([_, query]) => query)
);
```

### Error handling operators

```javascript
import { catchError, retry, retryWhen, throwError } from 'rxjs';

// catchError: handle errors
http.get('/api/data').pipe(
  map(data => process(data)),
  catchError(err => {
    console.error('API error:', err);
    return of(defaultData); // return fallback
    // or: return throwError(() => err); // re-throw
    // or: throw err; // re-throw
  })
).subscribe(data => console.log(data));

// retry: tự động retry on error
http.get('/api/data').pipe(
  retry(3), // retry 3 lần trước khi throw
  catchError(err => of(defaultData))
).subscribe(data => console.log(data));

// retry with delay
http.get('/api/data').pipe(
  retryWhen(errors => errors.pipe(
    delay(1000),
    take(3)
  ))
);
```

---

## 5. Real-World Patterns

### Auto-complete / Search

```javascript
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';

const searchInput = document.querySelector('#search');

fromEvent(searchInput, 'input').pipe(
  map(e => e.target.value),           // Extract text
  filter(text => text.length >= 2),   // Min 2 chars
  debounceTime(300),                  // Wait for user to stop typing
  distinctUntilChanged(),             // Same text = skip
  switchMap(text =>                   // Cancel previous search
    fetch(`/api/search?q=${text}`)
      .then(r => r.json())
      .catch(() => [])
  )
).subscribe(results => {
  renderResults(results);
});

// Full search flow:
// User types "a" → ignored (length < 2)
// User types "ab" → wait 300ms
// User types "abc" (within 300ms) → ignored, restart timer
// User stops → send search("abc")
// User types "abcd" → send search("abcd"), CANCEL search("abc")
```

### Real-time data with WebSocket

```javascript
import { webSocket } from 'rxjs/webSocket';
import { retry, tap, filter } from 'rxjs/operators';

// Create WebSocket as Observable
const ws$ = webSocket('wss://api.example.com/stream');

// Connect với auto-reconnect
const messages$ = ws$.pipe(
  retry({
    delay: 1000,
    count: Infinity,
    resetOnSuccess: true
  }),
  tap(msg => console.log('Received:', msg)),
  filter(msg => msg.type !== 'heartbeat') // ignore heartbeats
);

// Subscribe
const sub = messages$.subscribe({
  next: msg => handleMessage(msg),
  error: err => console.error('WS Error:', err),
  complete: () => console.log('Connection closed')
});

// Cleanup
setTimeout(() => sub.unsubscribe(), 30000);

// Send data
ws$.next({ type: 'subscribe', channel: 'prices' });
```

### State management với BehaviorSubject

```javascript
import { BehaviorSubject } from 'rxjs';

// Store = BehaviorSubject acting as single source of truth
class RxStore {
  constructor(initialState) {
    this._state$ = new BehaviorSubject(initialState);
  }

  // Select slice of state
  select(selector = state => state) {
    return this._state$.pipe(
      map(selector),
      distinctUntilChanged() // only emit if value changed
    );
  }

  // Dispatch action (immutable update)
  dispatch(action) {
    const currentState = this._state$.getValue();
    const newState = this.reduce(currentState, action);
    this._state$.next(newState);
  }

  reduce(state, action) {
    switch (action.type) {
      case 'INCREMENT':
        return { ...state, count: state.count + 1 };
      case 'SET_USER':
        return { ...state, user: action.payload };
      default:
        return state;
    }
  }

  // Get current value (for synchronous access)
  getValue() {
    return this._state$.getValue();
  }
}

// Usage:
const store = new RxStore({ count: 0, user: null });

// Subscribe to count
store.select(s => s.count).subscribe(count => {
  document.getElementById('count').textContent = count;
});

// Subscribe to user
store.select(s => s.user).subscribe(user => {
  renderUser(user);
});

// Dispatch actions
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'SET_USER', payload: { name: 'Alice' } });

// Angular, Vue 3 Reactivity, MobX đều dùng tương tự pattern này!
```

---

## 6. Custom Operators

```javascript
import { Observable, EMPTY } from 'rxjs';

// Tạo operator tùy chỉnh = function nhận Observable, return Observable

// Cách 1: pipeable operator (recommended)
const distinctUntilArrayItemChanged = () => {
  return (source$) => {
    return new Observable(observer => {
      let prevArray = undefined;

      return source$.subscribe({
        next(array) {
          if (!prevArray) {
            prevArray = array;
            observer.next(array);
            return;
          }

          // Compare items
          const changed = array.some((item, i) => prevArray[i] !== item);
          if (changed) {
            prevArray = array;
            observer.next(array);
          }
        },
        error(err) { observer.error(err); },
        complete() { observer.complete(); }
      });
    });
  };
};

// Cách 2: dùng existing operators
const distinctUntilArrayItemChanged2 = () => {
  return (source$) => source$.pipe(
    scan((prev, curr) => {
      const changed = prev?.some((v, i) => v !== curr[i]) ?? true;
      return changed ? curr : prev;
    }, undefined),
    filter(arr => arr !== undefined)
  );
};

// Usage
http.get('/api/items').pipe(
  distinctUntilArrayItemChanged()
).subscribe(items => updateUI(items));
```

---

## 7. Các Traps Phổ Biến

### Trap 1: Memory leak — không unsubscribe

```javascript
// ❌ Component destroy nhưng subscription vẫn chạy
class MyComponent {
  mount() {
    this.subscription = data$.subscribe(d => this.render(d));
    // Component unmount
    // → subscription vẫn alive → memory leak!
  }
}

// ✅ Always unsubscribe
class MyComponent {
  mount() {
    this.subscription = data$.subscribe(d => this.render(d));
  }

  unmount() {
    this.subscription.unsubscribe(); // Cleanup!
  }
}

// ✅ Dùng takeUntil (Angular pattern)
const destroy$ = new Subject();

data$.pipe(
  takeUntil(destroy$) // auto-unsubscribe khi destroy$ emits
).subscribe(d => this.render(d));

ngOnDestroy() {
  destroy$.next();
  destroy$.complete();
}

// ✅ Dùng first() nếu chỉ cần 1 giá trị
data$.pipe(first()).subscribe(d => this.render(d)); // auto-complete after 1 emit
```

### Trap 2: Not unsubscribing in React useEffect

```javascript
// ❌ useEffect không cleanup
useEffect(() => {
  data$.subscribe(d => setData(d)); // Subscription tồn tại sau unmount!
});

// ✅ Luôn return cleanup function
useEffect(() => {
  const sub = data$.subscribe(d => setData(d));
  return () => sub.unsubscribe(); // Cleanup!
}, []);

// ✅ Hoặc dùng Subscription array
useEffect(() => {
  const subs = [
    data$.subscribe(d => setData(d)),
    another$.subscribe(a => setAnother(a))
  ];
  return () => subs.forEach(sub => sub.unsubscribe());
}, []);
```

### Trap 3: Nested subscriptions (subscribe inside subscribe)

```javascript
// ❌ Nested subscribe = callback hell
data$.subscribe(data => {
  fetch(`/api/${data.id}`).then(res => {
    res.json().then(details => {
      this.details = details;
    });
  });
});

// ✅ Flatten với operators
data$.pipe(
  switchMap(data => fromFetch(`/api/${data.id}`).pipe(
    switchMap(res => res.json())
  ))
).subscribe(details => this.details = details);

// ✅ Hoặc flatten nested observables
data$.pipe(
  switchMap(data => details$(data.id)) // details$ là inner Observable
).subscribe(details => this.details = details);
```

### Trap 4: Forgetting to return subscription

```javascript
// ❌ Assignment = không return
const sub = obs$.subscribe(v => console.log(v)); // return undefined!

// ✅ Luôn assign và return
const subscription = obs$.subscribe(v => console.log(v));
// subscription có .unsubscribe() method

// ✅ Trong class:
class Component {
  subscriptions = [];

  mount() {
    const sub = data$.subscribe(d => this.render(d));
    this.subscriptions.push(sub); // Save reference
  }

  unmount() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
```

### Trap 5: BehaviorSubject initial value confusion

```javascript
// BehaviorSubject luôn có giá trị ban đầu
const bs = new BehaviorSubject(0);

bs.subscribe(v => console.log('Sub:', v)); // Sub: 0 (immediate!)

bs.next(1);
// Sub: 1

// ⚠️ Điều này có thể gây surprise
// Nếu bạn KHÔNG MUỐN nhận initial value:
// Dùng skip(1) để bỏ qua initial
bs.pipe(skip(1)).subscribe(v => console.log('Sub:', v));
// Chỉ nhận 1, không nhận 0
```

---

## 8. Câu Hỏi Phỏng Vấn

### Câu 1: Observable vs Promise

| | Observable | Promise |
|--|-----------|---------|
| Timing | Lazy (chạy khi subscribe) | Eager (chạy ngay khi tạo) |
| Values | Multiple (0, 1, 2... infinite) | Single (1 value) |
| Cancellation | ✅ Có (unsubscribe) | ❌ Không |
| Retry | ✅ Có (retry, retryWhen) | ❌ Không native |
| Composition | ✅ Rich operators | Limited |
| Error handling | Multiple options | Single catch |
| Sync/Async | Both | Async only (then/catch) |

```javascript
// Observable có thể cancel:
const sub = interval(1000).subscribe(n => console.log(n));
setTimeout(() => sub.unsubscribe(), 3500); // Stop after 3.5s → logs 0, 1, 2

// Promise KHÔNG cancel được:
const promise = fetch('/api/data');
promise.then(...); // Can't cancel this request!
```

---

### Câu 2: Hot vs Cold Observable

**Trả lời:** **Cold Observable** (default): mỗi subscriber nhận producer RIÊNG, producer restart mỗi lần subscribe. Dùng cho: HTTP requests, async operations. **Hot Observable**: tất cả subscribers nhận CÙNG giá trị từ producer CHUNG, producer có thể emit TRƯỚC khi subscribe. Dùng cho: DOM events, WebSocket streams, mouse movements. Subject là cách tạo Hot Observable.

---

### Câu 3: switchMap vs concatMap vs mergeMap

**Trả lời:** `switchMap` = cancel previous, keep latest (search, type-ahead). `concatMap` = queue, maintain order (form submissions, sequential). `mergeMap` = run all parallel, no order (non-dependent parallel fetches). `exhaustMap` = ignore new while processing (prevent double-submit).

---

### Câu 4: RxJS Operators mà bạn hay dùng?

```javascript
// Transforms
map, filter, scan, pluck, mapTo

// Combination
combineLatest, forkJoin, withLatestFrom, merge

// Filtering
debounceTime, distinctUntilChanged, take, takeUntil, skip, first, last, throttleTime

// Error handling
catchError, retry, retryWhen

// Timing
delay, interval, timer, timeout

// Conditional
takeUntil, skipUntil, takeWhile, takeIf
```

---

### Câu 5: Marble diagram là gì?

**Trả lời:** Marble diagrams là visual notation để mô tả Observable streams trong thời gian. Gồm: horizontal line (time), characters (emitted values), `|` (complete), `#` (error), `()` (multiple values same time). Ví dụ: `---a---b---|` = emit 'a' at time 3, 'b' at time 6, complete at time 8. Dùng để hiểu operators và debug streams.

---

### Câu 6: BehaviorSubject vs ReplaySubject

**Trả lời:** `BehaviorSubject` replay giá trị CUỐI CÙNG và initial value cho subscriber mới (chỉ 1 value). `ReplaySubject` replay N giá trị CUỐI (có thể nhiều hơn 1). `BehaviorSubject` = `{ currentValue }`, good cho state. `ReplaySubject` = event log, good cho historical data.

---

### Câu 7: Làm sao implement custom operator?

**Trả lời:** Pipeable operator = function nhận source Observable, return new Observable. Operator phải: unsubscribe source khi unsubscribe, forward errors/completions, clean up on unsubscribe. Dùng `Observable.create()` hoặc `source$.pipe(operators)`.

---

## 9. Tổng Hợp

```
┌──────────────────────────────────────────────────────────────┐
│  OBSERVABLE & REACTIVE                                          │
│                                                               │
│  OBSERVABLE                                                   │
│  ├── subscribe → emit → unsubscribe                          │
│  ├── Observable = lazy (cold), Subject = eager (hot)         │
│  └── Subject variants: BehaviorSubject, ReplaySubject        │
│                                                               │
│  RxJS OPERATORS                                               │
│  ├── Transform: map, filter, scan, reduce                   │
│  ├── Flatten: switchMap, concatMap, mergeMap, exhaustMap    │
│  ├── Combination: combineLatest, forkJoin, merge            │
│  ├── Timing: debounceTime, delay, throttleTime              │
│  └── Error: catchError, retry                               │
│                                                               │
│  USE CASES                                                    │
│  ├── Search/Auto-complete: debounce + switchMap              │
│  ├── Real-time: WebSocket + Subject                          │
│  ├── State management: BehaviorSubject + select              │
│  └── Cleanup: takeUntil, take, unsubscribe                   │
│                                                               │
│  ⚠️ Memory leak = not unsubscribing!                        │
│  ⚠️ Nested subscribes = use operators instead              │
│  ⚠️ switchMap cancels previous, concatMap queues           │
│  ⚠️ BehaviorSubject always has initial value               │
└──────────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Implement được custom Observable với subscribe/unsubscribe
- [ ] Phân biệt được Observable vs Subject vs BehaviorSubject
- [ ] Biết dùng switchMap, mergeMap, concatMap, exhaustMap
- [ ] Implement được auto-complete/search với debounce + switchMap
- [ ] Tránh được memory leak bằng proper cleanup
- [ ] Trả lời được 5/7 câu hỏi phỏng vấn

---

*Last updated: 2026-04-01*
