# Profiling & Optimization Strategy

## Nguyên tắc vàng

```
"Premature optimization is the root of all evil."
— Donald Knuth

CHỈ OPTIMIZE KHI CÓ DATA.
```

---

## 1. React DevTools Profiler

### Bật Profiler

```
1. Mở React DevTools
2. Chuyển sang tab "Profiler"
3. Click "Record"
4. Thực hiện actions trong app
5. Click "Stop"
6. Analyze results
```

### Đọc Flamegraph

```
Flamegraph:
  Width = thời gian render
  Color:
    ├── 🟨 Yellow = component re-rendered (longer)
    └── ⬜ White = not recorded

Wide bar = render lâu → CẦN optimize
```

---

## 2. Optimization Decision Tree

```
┌──────────────────────────────────────────────────────────────┐
│  IS APP SLOW? (measure with DevTools Profiler)               │
└────────────────────────────┬─────────────────────────────────┘
                            │
              ┌────────────┴────────────┐
            YES                         NO
              │                         ✓ Done
              ↓
┌─────────────────────────┐
│  IDENTIFY BOTTLENECK    │
│  (flamegraph, ranked)   │
└──────────────┬──────────┘
               │
    ┌──────────┴──────────┐
  Component          Bundle
  (render slow)    (load slow)
    │                  │
    ↓                  ↓
┌─────────────────┐ ┌─────────────────┐
│ 1. Why re-render?│ │ 1. Route split? │
│ 2. Memoize?      │ │ 2. Tree shake?  │
│ 3. Virtualize?   │ │ 3. CDN?        │
│ 4. Code split?   │ └─────────────────┘
└─────────────────┘
```

---

## 3. Common Techniques

### Virtualization — Long Lists

```jsx
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }) {
  return (
    <FixedSizeList height={400} itemCount={items.length} itemSize={50}>
      {({ index, style }) => (
        <div style={style}>
          <ListItem item={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Debounce/Throttle

```jsx
function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(query).then(setResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
}
```

---

## Checklist

- [ ] Measure FIRST — use DevTools Profiler
- [ ] Identify bottleneck — flamegraph, ranked chart
- [ ] Virtualize lists > 100 items
- [ ] Debounce/throttle expensive operations
- [ ] Avoid inline objects/arrays/functions in JSX

---

*Last updated: 2026-04-01*
