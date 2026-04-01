# DOM API — Thao Tác Với Trang Web

## Trước khi bắt đầu

DOM (Document Object Model) là cách trình duyệt biểu diễn HTML document dưới dạng cây object. Khi browser parse HTML, nó tạo DOM tree — mỗi HTML tag là một Node. JavaScript đọc và thay đổi DOM tree để cập nhật trang.

Nhưng DOM API là **Browser API**, không phải JavaScript. JavaScript engine không hiểu DOM — browser bindings cung cấp DOM API cho JavaScript gọi.

---

## 1. DOM Tree — Cấu Trúc

### Minh họa

```
document
└── html
    ├── head
    │   ├── title
    │   └── meta
    └── body
        ├── header
        │   ├── h1
        │   └── nav
        │       └── a
        └── main
            ├── div#app
            │   ├── p.text
            │   └── button
            └── footer
```

### Node types

```javascript
document.nodeType;          // 9 (DOCUMENT_NODE)
document.documentElement.nodeType; // 1 (ELEMENT_NODE)
document.head.nodeType;      // 1
document.body.nodeType;       // 1

// Node types constants
Node.ELEMENT_NODE;  // 1
Node.TEXT_NODE;     // 3
Node.COMMENT_NODE;  // 8
Node.DOCUMENT_NODE; // 9
```

---

## 2. DOM Selection

### getElementById

```javascript
// Nhanh nhất — id là unique
const app = document.getElementById('app');
```

### querySelector

```javascript
// CSS selector — linh hoạt nhất
const firstButton = document.querySelector('button.primary');
const navLink = document.querySelector('nav a.active');
const container = document.querySelector('.container');
```

### querySelectorAll

```javascript
// Trả về NodeList (không phải Array)
const buttons = document.querySelectorAll('button.primary');

// Duyệt
buttons.forEach(btn => console.log(btn.textContent));

// Chuyển sang Array
const buttonArray = Array.from(buttons);
const buttonArray2 = [...buttons];
```

### getElementsByClassName / getElementsByTagName

```javascript
// Trả về HTMLCollection — LIVE collection, KHÔNG có forEach
const items = document.getElementsByClassName('item');
const divs = document.getElementsByTagName('div');

// HTMLCollection: live — tự động cập nhật khi DOM thay đổi
// NodeList: static snapshot khi được tạo
```

---

## 3. HTMLCollection vs NodeList — Khác Nhau ở Đâu?

```javascript
const collection = document.getElementsByClassName('item'); // HTMLCollection
const nodeList = document.querySelectorAll('.item');        // NodeList

// Điểm khác nhau:
HTMLCollection:
  • Có item(index) và namedItem(name)
  • KHÔNG có forEach (trước ES6)
  • LIVE — tự cập nhật khi DOM thay đổi

NodeList:
  • Có forEach
  • Có item(index)
  • Static (phần lớn) hoặc live (childNodes)

// Chuyển sang Array khi cần
const arr = [...document.querySelectorAll('.item')];
```

### Live collection trap

```javascript
// HTMLCollection là live
const items = document.getElementsByClassName('item');

console.log(items.length); // 3
document.querySelector('.item').remove(); // xóa 1 item
console.log(items.length); // 2 — tự cập nhật!
```

---

## 4. DOM Traversal — Di Chuyển Trong DOM Tree

### Parent và Children

```javascript
const el = document.querySelector('.item');

el.parentElement;            // Element cha gần nhất
el.parentNode;             // Node cha (Element, Text, Comment)

el.children;              // HTMLCollection elements con
el.childNodes;            // NodeList (bao gồm text nodes)

el.firstElementChild;     // Element con đầu tiên
el.lastElementChild;      // Element con cuối cùng

el.firstChild;            // Node con đầu tiên (có thể là Text node)
el.lastChild;            // Node con cuối cùng
```

### Siblings

```javascript
const el = document.querySelector('.item');

el.nextElementSibling;    // Element kế tiếp
el.previousElementSibling; // Element trước

el.nextSibling;          // Node kế tiếp (bao gồm Text node)
el.previousSibling;       // Node trước
```

---

## 5. Đọc và Thay Đổi Nội Dung

### textContent vs innerText

```javascript
const el = document.querySelector('.item');

// textContent: đọc TẤT CẢ text (kể cả hidden)
el.textContent = 'New content';

// innerText: chỉ đọc text HIỂN THỊ (không hidden, không script)
el.innerText = 'New content';
```

### innerHTML vs textContent

```javascript
// ❌ XSS risk — innerHTML parse HTML
const userInput = '<img src=x onerror=alert(1)>';
el.innerHTML = userInput; // Security vulnerability!

// ✅ Safe — textContent không parse HTML
el.textContent = userInput; // hiển thị text thuần túy
```

### outerHTML

```javascript
el.outerHTML = '<div class="new">New element</div>';
// Thay thế element hoàn toàn (kể cả tag cha)
```

---

## 6. Attributes

### Đọc và set attribute

```javascript
const link = document.querySelector('a');

// Đọc
link.getAttribute('href');         // '/page'
link.getAttribute('target');         // '_blank'
link.hasAttribute('disabled');       // false

// Set
link.setAttribute('href', '/new-page');
link.setAttribute('target', '_self');
link.removeAttribute('disabled');

// Đọc property (khác với attribute)
link.href; // 'https://example.com/new-page' (absolute URL)
```

### data-* attributes

```javascript
const card = document.querySelector('.card');

// Đọc: data-id="123" → el.dataset.id
card.dataset.id;           // '123'
card.dataset.userName;      // camelCase: data-user-name

// Set
card.dataset.id = '456';

// Xóa
delete card.dataset.id;
```

---

## 7. ClassList — Quản Lý Classes

```javascript
const el = document.querySelector('.button');

// Thêm class
el.classList.add('primary');
el.classList.add('active', 'rounded'); // nhiều class

// Xóa class
el.classList.remove('primary');
el.classList.remove('active', 'rounded');

// Toggle
el.classList.toggle('active'); // thêm nếu chưa có, xóa nếu đã có

// Toggle với force
el.classList.toggle('disabled', true);  // luôn thêm
el.classList.toggle('disabled', false); // luôn xóa

// Kiểm tra
el.classList.contains('primary'); // true/false

// Replace
el.classList.replace('old-class', 'new-class');
```

---

## 8. Tạo và Chèn Elements

### Tạo element

```javascript
// Tạo element
const div = document.createElement('div');
div.textContent = 'Hello';
div.className = 'container';
div.id = 'main';

// Tạo text node
const text = document.createTextNode('Hello World');
```

### Chèn vào DOM

```javascript
const parent = document.querySelector('.parent');

// append — chèn vào cuối (nhiều nodes)
parent.append(div, text);
parent.append('Plain text'); // cũng hỗ trợ string

// prepend — chèn vào đầu
parent.prepend(newElement);

// before — chèn trước element
el.before(newElement);

// after — chèn sau element
el.after(newElement);
```

### replaceWith

```javascript
// Thay thế element
const newEl = document.createElement('span');
newEl.textContent = 'Replacement';
el.replaceWith(newEl);
```

### remove

```javascript
// Xóa element
el.remove();        // Modern
parent.removeChild(el); // Legacy

// Xóa nhiều
document.querySelectorAll('.to-remove').forEach(el => el.remove());
```

---

## 9. Styles

### Inline styles

```javascript
const el = document.querySelector('.box');

el.style.color = 'red';
el.style.backgroundColor = 'blue'; // camelCase!
el.style.fontSize = '16px';
el.style.cssText = 'color: red; background: blue;'; // set nhiều
```

### Computed styles

```javascript
const el = document.querySelector('.box');

// Đọc computed style (sau khi CSS applied)
const computed = window.getComputedStyle(el);
computed.color;         // 'rgb(255, 0, 0)'
computed.backgroundColor; // 'rgb(0, 0, 255)'
computed.fontSize;       // '16px'
```

---

## 10. Event Model

### Event Phases

```
Capture Phase:   window → document → html → body → ... → target
Target Phase:   (tại target element)
Bubble Phase:    target → ... → body → html → document → window
```

### addEventListener

```javascript
const btn = document.querySelector('button');

// Add listener
btn.addEventListener('click', function(event) {
  console.log('Clicked!');
});

// Listener với options
btn.addEventListener('click', handler, {
  capture: true,    // capture phase thay vì bubble
  once: true,       // chỉ chạy 1 lần
  passive: true      // không gọi preventDefault (tối ưu scroll)
});
```

### removeEventListener

```javascript
// ⚠️ Phải reference cùng function
const handler = () => console.log('Clicked!');

btn.addEventListener('click', handler);
btn.removeEventListener('click', handler); // OK — cùng function

// ❌ Sai: anonymous function
btn.addEventListener('click', function() {});
btn.removeEventListener('click', function() {}); // KHÔNG xóa được
```

### Event object

```javascript
btn.addEventListener('click', (event) => {
  event.target;              // element bị click
  event.currentTarget;       // element có listener (this)
  event.type;                // 'click'
  event.bubbles;             // true
  event.cancelable;          // true
  event.defaultPrevented;     // false
  event.propagationStopped;   // false

  // Ngăn chặn
  event.preventDefault();    // ngăn default behavior
  event.stopPropagation();    // ngăn bubbling
  event.stopImmediatePropagation(); // ngăn + disable listeners khác
});
```

---

## 11. Event Delegation — Pattern Quan Trọng

### Vấn đề

```javascript
// ❌ Nếu có 1000 buttons — tạo 1000 listeners
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', handleClick);
});
```

### Giải pháp: delegation

```javascript
// ✅ 1 listener trên parent — delegate đến children
document.querySelector('.list').addEventListener('click', (event) => {
  // event.target = element bị click
  const button = event.target.closest('button');

  if (button) {
    handleClick(button);
  }
});
```

### closest()

```javascript
// closest() tìm từ element hiện tại lên ancestors
const el = document.querySelector('.nested-button');

// Tìm button gần nhất có class .item
const item = el.closest('.item');
```

---

## 12. Custom Events

### Tạo và dispatch

```javascript
// Tạo custom event
const event = new CustomEvent('user-login', {
  detail: { userId: 123, name: 'Alice' }
});

// Dispatch
element.dispatchEvent(event);

// Listen
element.addEventListener('user-login', (event) => {
  console.log(event.detail.userId); // 123
});
```

---

## 13. Các Traps Phổ Biến

### Trap 1: innerHTML XSS

```javascript
// ❌ XSS vulnerability
const userInput = req.query.content; // '<script>alert(1)</script>'
el.innerHTML = userInput;

// ✅ Safe: dùng textContent
el.textContent = userInput;

// ✅ Nếu cần HTML: sanitize
import DOMPurify from 'dompurify';
el.innerHTML = DOMPurify.sanitize(userInput);
```

### Trap 2: NodeList không có forEach (cũ)

```javascript
// ❌ Sai: IE không có forEach trên NodeList
const nodes = document.querySelectorAll('div');
nodes.forEach(node => {}); // lỗi trên IE

// ✅ Đúng: chuyển sang Array
Array.from(nodes).forEach(node => {});
[...nodes].forEach(node => {});
```

### Trap 3: Event listener không cleanup

```javascript
// ❌ Memory leak: listener không được xóa
function addHandler() {
  el.addEventListener('click', handler); // thêm mỗi lần gọi
}

addHandler();
addHandler(); // 2 listeners!

// ✅ Đúng: cleanup
function setup() {
  el.addEventListener('click', handler);
  return () => el.removeEventListener('click', handler);
}

const cleanup = setup();
// Khi không cần:
cleanup();
```

### Trap 4: innerHTML parse HTML

```javascript
// ❌ innerHTML parse HTML — tốn performance
el.innerHTML = '<div>' + content + '</div>';

// ✅ Thay thế bằng createElement + append
const div = document.createElement('div');
div.textContent = content; // không parse HTML
el.appendChild(div);
```

---

## 14. Câu Hỏi Phỏng Vấn

### Câu 1: innerHTML vs textContent

**Trả lời:** `innerHTML` parse và render HTML — có XSS risk, chậm hơn. `textContent` chỉ set text thuần túy — an toàn hơn, nhanh hơn.

---

### Câu 2: HTMLCollection vs NodeList

| | HTMLCollection | NodeList |
|--|----------------|----------|
| Selector | `getElementsBy*` | `querySelectorAll` |
| Live/Static | Live | Static (thường) |
| forEach | Không có | Có |
| children | Có | Không |

---

### Câu 3: Capture vs Bubble

**Trả lời:** Capture chạy từ ngoài vào trong (window → target). Bubble chạy từ trong ra ngoài (target → window). `addEventListener` mặc định là bubble. Dùng `{ capture: true }` để đổi sang capture.

---

### Câu 4: stopPropagation vs stopImmediatePropagation

**Trả lời:** `stopPropagation()` ngăn event bubbling/capturing tiếp. `stopImmediatePropagation()` ngăn + disable các listeners khác trên cùng element.

---

### Câu 5: closest()

```javascript
// closest() tìm từ element lên ancestors
const el = document.querySelector('.button');
const form = el.closest('form');
```

**Trả lời:** `closest()` đi từ element hiện tại lên DOM tree, trả về element đầu tiên match selector, hoặc null.

---

### Câu 6: Event delegation — tại sao dùng?

**Trả lời:** Event delegation giảm số lượng listeners, xử lý dynamic elements tốt hơn, và tránh memory leaks. 1 listener trên parent thay vì N listeners trên mỗi child.

---

## 15. Tổng Hợp

```
┌─────────────────────────────────────────────────────────┐
│  DOM API                                                       │
│                                                         │
│  Selection: querySelector, getElementById              │
│  Traversal: parentElement, children, siblings           │
│  Content: textContent (safe), innerHTML (XSS risk)      │
│  Attributes: getAttribute, dataset                     │
│  Class: classList.add/remove/toggle/contains         │
│  Insert: append, prepend, before, after, remove       │
│  Events: addEventListener, capture/bubble            │
│  Delegation: 1 listener trên parent                │
│                                                         │
│  ⚠️ innerHTML = XSS risk → dùng textContent          │
│  ⚠️ HTMLCollection live, NodeList static             │
│  ⚠️ removeEventListener cần cùng function reference │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist

- [ ] Select và traverse DOM elements
- [ ] Create và insert nodes
- [ ] Quản lý attributes và classes
- [ ] Dùng được event delegation
- [ ] Trả lời được 6/6 câu phỏng vấn

---

*Last updated: 2026-03-31*
