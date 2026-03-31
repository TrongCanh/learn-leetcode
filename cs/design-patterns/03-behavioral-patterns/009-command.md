# 📦 Command Pattern

## 🎯 Problem & Motivation

**Bài toán thực tế:** Bạn cần **encapsulate một request/action thành object**, để có thể:
- **Queue** requests (thực thi sau, batch)
- **Undo/Redo** (lưu lịch sử actions)
- **Logging** (ghi lại actions để replay sau crash)
- **Macro** (gộp nhiều commands thành một)

**Ví dụ thực tế:** Text editor — Ctrl+Z (undo), Ctrl-Y (redo), macro recording, clipboard. Mỗi action (type, delete, paste) được đóng gói thành Command object.

```typescript
// ❌ Commands hard-coded trong UI — không có undo
class Button {
  onClick(action: string, ...args: any[]) {
    if (action === 'cut') {
      editor.cut();
    } else if (action === 'copy') {
      editor.copy();
    } else if (action === 'paste') {
      editor.paste();
    } else if (action === 'delete') {
      editor.delete();
    }
    // ⚠️ Không có history → không undo/redo!
    // ⚠️ Thêm command → sửa Button class!
  }
}
```

→ **Hậu quả:** Không có history → không undo/redo. Không queue → không replay. Không logging → không replay sau crash.

**Command giải quyết:** Mỗi action được đóng gói thành `Command` object với method `execute()` và `undo()`. Invoker gọi `execute()` mà không biết action cụ thể là gì.

---

## 💡 Use Cases

1. **Undo/Redo system** — Text editor, graphics editor, IDE refactoring
2. **Macro Recording** — Record sequence of actions → replay
3. **Async Task Queue** — Job queue, message queue, cron jobs
4. **Transactional Operations** — Database transactions (commit/rollback)
5. **Remote Procedure Call** — Serialize command → send over network → execute remote
6. **Menu buttons / Toolbar** — Mỗi menu item là một Command object

---

## ❌ Before (Không dùng Command)

```typescript
// ❌ Không có history → không undo/redo
class TextEditor {
  private content: string = '';

  type(text: string) {
    this.content += text;
  }

  delete(count: number) {
    this.content = this.content.slice(0, -count);
  }

  clear() {
    this.content = ''; // ⚠️ Xóa mất rồi, không undo được!
  }
}
```

→ **Hậu quả:** Không lưu lại previous state. Undo gần như bất khả thi với approach này.

---

## ✅ After (Dùng Command)

```typescript
// ─────────────────────────────────────────
// 1. Command Interface — contract cho tất cả commands
// ─────────────────────────────────────────
interface Command {
  execute(): void;
  undo(): void;
}

// ─────────────────────────────────────────
// 2. Receiver — Object thực sự thực hiện công việc
// ─────────────────────────────────────────
class TextEditor {
  private _content: string = '';

  get content(): string { return this._content; }

  append(text: string): void {
    this._content += text;
  }

  delete(count: number): string {
    const deleted = this._content.slice(-count);
    this._content = this._content.slice(0, -count);
    return deleted;
  }

  insert(position: number, text: string): void {
    this._content = this._content.slice(0, position) + text + this._content.slice(position);
  }

  setContent(text: string): void {
    this._content = text;
  }
}

// ─────────────────────────────────────────
// 3. Concrete Commands — encapsulate từng action
// ─────────────────────────────────────────

// Command: Type text
class TypeCommand implements Command {
  constructor(private editor: TextEditor, private text: string) {}

  execute(): void {
    this.editor.append(this.text);
  }

  undo(): void {
    this.editor.delete(this.text.length);
  }
}

// Command: Delete với state để undo
class DeleteCommand implements Command {
  private deletedText: string = '';

  constructor(
    private editor: TextEditor,
    private count: number
  ) {}

  execute(): void {
    this.deletedText = this.editor.delete(this.count);
  }

  undo(): void {
    this.editor.append(this.deletedText);
  }
}

// Command: Insert
class InsertCommand implements Command {
  constructor(
    private editor: TextEditor,
    private position: number,
    private text: string
  ) {}

  execute(): void {
    this.editor.insert(this.position, this.text);
  }

  undo(): void {
    this.editor.delete(this.text.length);
  }
}

// Command: Replace all
class ReplaceCommand implements Command {
  private previousContent: string = '';

  constructor(
    private editor: TextEditor,
    private search: string,
    private replacement: string
  ) {}

  execute(): void {
    this.previousContent = this.editor.content;
    const newContent = this.previousContent.split(this.search).join(this.replacement);
    this.editor.setContent(newContent);
  }

  undo(): void {
    this.editor.setContent(this.previousContent);
  }
}

// ─────────────────────────────────────────
// 4. Invoker — gọi commands, maintain history
// ─────────────────────────────────────────
class CommandManager {
  private history: Command[] = [];
  private future: Command[] = []; // For redo

  execute(command: Command): void {
    command.execute();
    this.history.push(command);
    this.future = []; // Clear redo stack on new action
    console.log(`✅ Executed: ${command.constructor.name} → "${command['text'] ?? command['search'] ?? command['count'] ?? ''}"`);
  }

  undo(): void {
    const command = this.history.pop();
    if (!command) {
      console.log('❌ Nothing to undo');
      return;
    }
    command.undo();
    this.future.push(command);
    console.log(`↩️ Undo: ${command.constructor.name}`);
  }

  redo(): void {
    const command = this.future.pop();
    if (!command) {
      console.log('❌ Nothing to redo');
      return;
    }
    command.execute();
    this.history.push(command);
    console.log(`↪️ Redo: ${command.constructor.name}`);
  }

  showHistory(): void {
    console.log(`\n📜 History (${this.history.length} actions):`);
    this.history.forEach((c, i) => {
      const detail = (c as any).text ?? (c as any).search ?? (c as any).count ?? '';
      console.log(`  ${i + 1}. ${c.constructor.name}${detail ? `: "${detail}"` : ''}`);
    });
  }
}

// ─────────────────────────────────────────
// 5. Client — compose commands
// ─────────────────────────────────────────
const editor = new TextEditor();
const manager = new CommandManager();

manager.execute(new TypeCommand(editor, 'Hello'));
manager.execute(new TypeCommand(editor, ' '));
manager.execute(new TypeCommand(editor, 'World!'));
console.log(`📝 Editor: "${editor.content}"`);
// 📝 Editor: "Hello World!"

manager.execute(new DeleteCommand(editor, 6));
console.log(`📝 After delete: "${editor.content}"`);
// 📝 After delete: "Hello "

manager.showHistory();
// 📜 History (4 actions):
//  1. TypeCommand: "Hello"
//  2. TypeCommand: " "
//  3. TypeCommand: "World!"
//  4. DeleteCommand: "6"

console.log('\n--- Undo ---');
manager.undo();
// ↩️ Undo: DeleteCommand
console.log(`📝 Editor: "${editor.content}"`);
// 📝 Editor: "Hello World!"

manager.undo();
console.log(`📝 Editor: "${editor.content}"`);
// 📝 Editor: "Hello "

console.log('\n--- Redo ---');
manager.redo();
// ↪️ Redo: TypeCommand
console.log(`📝 Editor: "${editor.content}"`);
// 📝 Editor: "Hello World!"

manager.redo();
console.log(`📝 Editor: "${editor.content}"`);
// 📝 Editor: "Hello World!" (delete không redo được vì đã bị history mới clear)
```

---

## 🏗️ UML Diagram

```
┌──────────────┐         ┌──────────────────┐
│   Invoker    │────────▶│  <<interface>>   │
│ (CommandMgr) │         │     Command       │
├──────────────┤         ├──────────────────┤
│ +execute()   │         │ +execute()        │
│ +undo()      │         │ +undo()           │
│ +redo()      │         └────────┬───────────┘
└──────────────┘                  │ implements
                                  │
               ┌──────────────────┴──────────────────┐
               ▼                                     ▼
        ┌────────────┐                       ┌────────────┐
        │TypeCommand │                       │DeleteCommand│
        ├────────────┤                       ├────────────┤
        │ +execute() │                       │ +execute() │
        │ +undo()    │                       │ +undo()    │
        │ state: ""  │                       │ deleted: ""│
        └─────┬──────┘                       └─────┬──────┘
              │                                   │
              └─────────────────┴─────────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │     Receiver      │
                     │  (TextEditor)     │
                     └──────────────────┘
```

---

## 🔍 Step-by-step Trace

**Scenario:** Type "Hello World", delete 6 chars, undo.

```
Bước 1: TypeCommand('Hello').execute()
  → editor.append('Hello')
  → history = [TypeCommand('Hello')]

Bước 2: TypeCommand(' World').execute()
  → editor.append(' World')
  → history = [TypeCommand('Hello'), TypeCommand(' World')]

Bước 3: DeleteCommand(6).execute()
  → editor.delete(6) → xóa ' World'
  → deletedText = ' World'
  → editor.content = 'Hello'
  → history = [TypeCommand('Hello'), TypeCommand(' World'), DeleteCommand(6)]
  → future = []

Bước 4: undo()
  → Pop DeleteCommand(6) từ history
  → command.undo() → editor.append(' World')
  → editor.content = 'Hello World'
  → future = [DeleteCommand(6)]

Output: Editor = 'Hello World' ✅
History: [TypeCommand('Hello'), TypeCommand(' World')]
Future:  [DeleteCommand(6)]
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Chi tiết implementation |
|---------------------|------------------------|
| **UndoManager (macOS/iOS)** | Built-in undo/redo system |
| **Redux** | Action = Command object; reducer = receiver |
| **RabbitMQ / Kafka** | Message = Command; consumer = receiver |
| **GUI Menu buttons** | Mỗi menu item = Command |
| **SQL Transaction** | BEGIN → commands → COMMIT/ROLLBACK |
| **Jira Workflow** | Issue transition = Command với validate |

---

## 📊 So sánh với Patterns liên quan

| Criteria | **Command** | Strategy | Observer |
|----------|------------|----------|----------|
| Mục đích | Encapsulate request | Encapsulate algorithm | Notify observers |
| Support undo? | ✅ Có | ❌ Không | ❌ Không |
| Execution time | Now, later, or never | Now | Now (push) |
| State | Command giữ state để undo | Strategy stateless thường | Subject giữ state |

---

## 💻 TypeScript Implementation

### Version 1: Macro Command — batch operations

```typescript
// MacroCommand: execute nhiều commands như một
class MacroCommand implements Command {
  private commands: Command[] = [];

  constructor(commands: Command[] = []) {
    this.commands = commands;
  }

  add(command: Command): void {
    this.commands.push(command);
  }

  execute(): void {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo(): void {
    // Undo in REVERSE order — quan trọng!
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}

// Usage: "Format + Color + Save" = one macro
class FormatCommand implements Command {
  execute() { console.log('📝 Formatting...'); }
  undo() { console.log('📝 Undo formatting'); }
}

class ColorCommand implements Command {
  constructor(private color: string) {}
  execute() { console.log(`🎨 Applying color: ${this.color}`); }
  undo() { console.log('🎨 Reset color'); }
}

class SaveCommand implements Command {
  execute() { console.log('💾 File saved!'); }
  undo() { console.log('💾 Undo save'); }
}

const formatMacro = new MacroCommand([
  new FormatCommand(),
  new ColorCommand('red'),
  new SaveCommand()
]);

const mgr2 = new CommandManager();
mgr2.execute(formatMacro);
console.log('--- Undo macro ---');
mgr2.undo();
// ↩️ Undo: MacroCommand
// 💾 Undo save
// 🎨 Reset color
// 📝 Undo formatting
```

---

## ⚖️ Trade-offs & Common Mistakes

### ✅ Khi nào nên dùng

- ✅ Cần **undo/redo** functionality
- ✅ Cần **queue, delay, schedule** execution
- ✅ Cần **macro** — batch multiple operations
- ✅ Cần **logging và replay** actions (VD: auto-save)

### ❌ Khi nào không nên dùng

- ❌ Đơn giản, không cần undo/redo
- ❌ Không có queueing/scheduling needs
- ❌ Actions không có inverse (VD: "send email" — không thể undo)

### 🚫 Common Mistakes

**1. Undo không restore đúng state**
```typescript
// ❌ Sai: DeleteCommand không lưu deleted text
class BadDeleteCommand implements Command {
  execute() {
    this.editor.delete(this.count); // ❌ Deleted text bị mất!
  }
  undo() {
    // ❌ Không biết xóa gì!
  }
}

// ✅ Đúng: Lưu deleted text để restore
class GoodDeleteCommand implements Command {
  private deletedText: string = '';

  execute() {
    this.deletedText = this.editor.delete(this.count);
  }

  undo() {
    this.editor.append(this.deletedText); // ✅ Restore
  }
}
```

**2. MacroCommand undo không reverse order**
```typescript
// ❌ Sai: Undo cùng thứ tự execute
undo() {
  for (const cmd of this.commands) { // ❌ SAI THỨ TỰ!
    cmd.undo();
  }
}

// ✅ Đúng: Undo reverse order
undo() {
  for (let i = this.commands.length - 1; i >= 0; i--) {
    this.commands[i].undo();
  }
}
```

**3. Command quá lớn — làm quá nhiều thứ**
```typescript
// ❌ Sai: Một command làm TẤT CẢ
class BadCommand implements Command {
  execute() {
    this.login(); // ❌ Nhiều trách nhiệm
    this.fetchData();
    this.render();
  }
}
// → Nên chia: LoginCommand, FetchCommand, RenderCommand riêng
```

---

## 🧪 Testing Strategies

```typescript
describe('CommandManager', () => {
  it('should undo/redo correctly', () => {
    const editor = new TextEditor();
    const mgr = new CommandManager();

    mgr.execute(new TypeCommand(editor, 'Hello'));
    mgr.execute(new TypeCommand(editor, ' World'));
    expect(editor.content).toBe('Hello World');

    mgr.undo();
    expect(editor.content).toBe('Hello');

    mgr.redo();
    expect(editor.content).toBe('Hello World');
  });

  it('should clear redo stack on new action', () => {
    const editor = new TextEditor();
    const mgr = new CommandManager();

    mgr.execute(new TypeCommand(editor, 'A'));
    mgr.undo();
    expect(mgr['future'].length).toBe(1);

    mgr.execute(new TypeCommand(editor, 'B'));
    expect(mgr['future'].length).toBe(0); // Clear!
  });

  it('should restore previous state on undo', () => {
    const editor = new TextEditor();
    const mgr = new CommandManager();

    mgr.execute(new DeleteCommand(editor, 3));
    expect(editor.content).toBe('');

    mgr.undo();
    expect(editor.content).toBe('World'); // Restored!
  });
});
```

---

## 🔄 Refactoring Path

**Từ Imperative Code → Command:**

```typescript
// ❌ Before: imperative, không undo được
function processForm(form: Form) {
  validate(form);
  saveToDatabase(form);
  sendEmail(form);
  redirect('/success');
}

// ✅ After: Command pattern
class ProcessFormCommand implements Command {
  execute() {
    validate(this.form);
    saveToDatabase(this.form);
    sendEmail(this.form);
    redirect('/success');
  }

  undo() {
    deleteFromDatabase(this.form.id);
  }
}
```

---

## 🎤 Interview Q&A

**Q: Command Pattern là gì? Khi nào dùng?**
> A: Command đóng gói một request/action thành object với method `execute()` và `undo()`. Điều này cho phép queue requests, undo/redo, logging, và macro. Dùng khi cần undo/redo (text editors, IDEs), task queue (job schedulers), hoặc batch operations (macros). Quan trọng: mỗi command phải lưu đủ state để `undo()` restore đúng.

**Q: Command vs Function callback khác nhau gì?**
> A: Callback là function được passed như argument — stateless, không có undo. Command là object với state (data cần thiết để undo) và method `undo()`. Callback dùng khi chỉ cần execute once, không cần reverse. Command dùng khi cần undo, queue, hoặc replay.

**Q: Làm sao implement undo/redo hiệu quả?**
> A: Dùng 2 stacks: `history` (undo) và `future` (redo). Execute → push vào history, clear future. Undo → pop từ history, call undo(), push vào future. Redo → pop từ future, call execute(), push vào history. Giới hạn history size (VD: 100 commands) để tránh memory leak.
