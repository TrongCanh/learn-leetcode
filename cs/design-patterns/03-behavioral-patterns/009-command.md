# 📦 Command Pattern

## 🎯 Problem & Motivation

**Bài toán:** Bạn cần **encapsulate một request thành object**, để có thể:
- **Queue** requests (thực thi sau)
- **Undo/Redo** (lưu lịch sử)
- **Logging** (ghi lại actions)
- **Macro** (group nhiều commands thành một)

**Ví dụ thực tế:** Text editor — Ctrl+Z (undo), Ctrl-Y (redo), macro recording, clipboard.

**Command giải quyết:** Mỗi action được đóng gói thành `Command` object với method `execute()`. Invoker gọi `execute()` mà không biết action cụ thể là gì.

---

## 💡 Use Cases

1. **Undo/Redo system** — Text editor, graphics editor, IDE refactoring
2. **Macro Recording** — Record sequence of actions → replay
3. **Async Task Queue** — Job queue, message queue, cron jobs
4. **Transactional Operations** — Database transactions (commit/rollback)
5. **Remote Procedure Call** — Serialize command → send over network → execute remote
6. **Menu buttons** — Mỗi menu item là một Command object

---

## ❌ Before (Không dùng Command)

```typescript
// ❌ Commands hard-coded trong UI
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
    // ⚠️ Thêm command mới? Sửa Button class!
  }
}
```

→ **Vấn đề:** Button phải biết tất cả actions → tight coupling. Không có history → không undo/redo. Không queue → không replay.

---

## ✅ After (Dùng Command)

```typescript
// ─────────────────────────────────────────
// 1. Command Interface — contract cho tất cả commands
// ─────────────────────────────────────────
interface Command {
  execute(): void;
  undo(): void; // Support undo!
}

// ─────────────────────────────────────────
// 2. Receiver — Object thực sự thực hiện công việc
// ─────────────────────────────────────────
class TextEditor {
  private content: string = '';

  getContent(): string {
    return this.content;
  }

  append(text: string): void {
    this.content += text;
  }

  delete(count: number): string {
    const deleted = this.content.slice(-count);
    this.content = this.content.slice(0, -count);
    return deleted;
  }

  setContent(text: string): void {
    this.content = text;
  }
}

// ─────────────────────────────────────────
// 3. Concrete Commands — encapsulate từng action
// ─────────────────────────────────────────

// Command: Type text
class TypeCommand implements Command {
  constructor(
    private editor: TextEditor,
    private text: string
  ) {}

  execute(): void {
    this.editor.append(this.text);
  }

  undo(): void {
    this.editor.delete(this.text.length);
  }
}

// Command: Delete
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
    // Restore deleted text
    this.editor.append(this.deletedText);
  }
}

// Command: Paste (có thể undo được)
class PasteCommand implements Command {
  private pastedText: string = '';

  constructor(
    private editor: TextEditor,
    private clipboard: string
  ) {}

  execute(): void {
    this.pastedText = this.clipboard;
    this.editor.append(this.pastedText);
  }

  undo(): void {
    this.editor.delete(this.pastedText.length);
  }
}

// Command: Replace all (complex command)
class ReplaceCommand implements Command {
  private previousContent: string = '';

  constructor(
    private editor: TextEditor,
    private search: string,
    private replacement: string
  ) {}

  execute(): void {
    this.previousContent = this.editor.getContent();
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
    console.log(`✅ Executed: ${command.constructor.name}`);
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
    console.log(`📜 History (${this.history.length}):`);
    this.history.forEach((c, i) => console.log(`  ${i + 1}. ${c.constructor.name}`));
  }
}

// ─────────────────────────────────────────
// 5. Client — compose commands
// ─────────────────────────────────────────
const editor = new TextEditor();
const manager = new CommandManager();
const clipboard = 'Hello World!';

manager.execute(new TypeCommand(editor, 'Hello'));
// ✅ Editor: "Hello"

manager.execute(new TypeCommand(editor, ' '));
manager.execute(new TypeCommand(editor, 'World!'));
// ✅ Editor: "Hello World!"

manager.execute(new DeleteCommand(editor, 6));
// ✅ Editor: "Hello "
manager.showHistory();
// 📜 History:
//  1. TypeCommand
//  2. TypeCommand
//  3. TypeCommand
//  4. DeleteCommand

manager.undo();
// ↩️ Undo: DeleteCommand
// ✅ Editor: "Hello World!"

manager.undo();
// ↩️ Undo: TypeCommand
// ✅ Editor: "Hello "

manager.redo();
// ↪️ Redo: TypeCommand
// ✅ Editor: "Hello World!"
```

→ **Cải thiện:** Thêm command mới? Tạo class implements `Command`. Undo/redo tự động. History tracking không cần thay đổi Invoker.

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
               ┌──────────────────┼──────────────────┐
               ▼                  ▼                  ▼
        ┌────────────┐    ┌────────────┐    ┌────────────┐
        │ TypeCommand│    │DeleteCommand│   │ PasteCommand│
        ├────────────┤    ├────────────┤    ├────────────┤
        │ +execute() │    │ +execute() │    │ +execute() │
        │ +undo()    │    │ +undo()    │    │ +undo()    │
        └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
              │                 │                  │
              └─────────────────┴──────────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │     Receiver      │
                     │  (TextEditor)    │
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
  → history = [TypeCommand('Hello'), TypeCommand(' World'), DeleteCommand]

Bước 4: undo()
  → Pop DeleteCommand(6)
  → command.undo() → editor.append(' World')
  → editor.content = 'Hello World'
  → future = [DeleteCommand(6)]

Output: Editor = 'Hello World' ✅
History: [TypeCommand('Hello'), TypeCommand(' World')]
Future:  [DeleteCommand(6)]
```

---

## 🌍 Real-world Examples

| Thư viện/Framework | Cách dùng Command |
|--------------------|-----------------|
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

```typescript
// ─────────────────────────────────────────
// Example: Macro Command — batch operations
// ─────────────────────────────────────────

// MacroCommand: execute nhiều commands như một
class MacroCommand implements Command {
  private commands: Command[] = [];

  constructor(commands: Command[]) {
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
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}

// Usage: "Make text bold + change color + save" = one macro
class BoldCommand implements Command {
  constructor(private editor: TextEditor) {}
  execute() { console.log('📝 Apply bold'); }
  undo() { console.log('📝 Remove bold'); }
}

class ColorCommand implements Command {
  constructor(private editor: TextEditor, private color: string) {}
  execute() { console.log(`🎨 Apply color: ${this.color}`); }
  undo() { console.log('🎨 Reset color'); }
}

class SaveCommand implements Command {
  constructor(private editor: TextEditor) {}
  execute() { console.log('💾 File saved!'); }
  undo() { console.log('💾 Undo save (delete file)'); }
}

const formatMacro = new MacroCommand([
  new BoldCommand(editor),
  new ColorCommand(editor, 'red'),
  new SaveCommand(editor)
]);

const manager2 = new CommandManager();
manager2.execute(formatMacro);
// ✅ Executed: MacroCommand
// 📝 Apply bold
// 🎨 Apply color: red
// 💾 File saved!

console.log('--- Undo macro ---');
manager2.undo();
// ↩️ Undo: MacroCommand
// 💾 Undo save
// 🎨 Reset color
// 📝 Remove bold
```

---

## 📝 LeetCode Problems áp dụng

- [Design Search Autocomplete System](https://leetcode.com/problems/design-search-autocomplete-system/) — Command pattern cho search history
- [Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation/) — Mỗi operator = Command được execute
- [Design In Memory File System](https://leetcode.com/problems/design-in-memory-file-system/) — Commands: mkdir, ls, add, cd

---

## ✅ Pros / ❌ Cons

**Ưu điểm:**
- ✅ **Undo/Redo** — Command lưu state cần thiết để revert
- ✅ **Queue & Scheduling** — execute commands later, batch operations
- ✅ **Macro** — group commands thành một composite command
- ✅ **Loose coupling** — invoker không biết concrete command
- ✅ **Logging** — log commands để replay sau crash

**Nhược điểm:**
- ❌ **Complex** — cần implement undo() cho mỗi command
- ❌ **Memory** — history lưu nhiều commands có thể tốn memory
- ❌ **Many Command classes** — mỗi action cần một class

---

## ⚠️ Khi nào nên / không nên dùng

**Nên dùng khi:**
- ✅ Cần **undo/redo** functionality
- ✅ Cần **queue, delay, schedule** execution
- ✅ Cần **macro** — batch multiple operations
- ✅ Cần **logging và replay** actions

**Không nên dùng khi:**
- ❌ Đơn giản, không cần undo/redo
- ❌ Không có queueing/scheduling needs
- ❌ Actions không có inverse (VD: "send email" — không thể undo email đã gửi)

---

## 🚫 Common Mistakes / Pitfalls

1. **Undo không restore đúng state**
   ```typescript
   // ❌ Sai: DeleteCommand không lưu deleted text
   class BadDeleteCommand implements Command {
     constructor(private editor: TextEditor, private count: number) {}

     execute() {
       // ❌ Deleted text bị mất! Không thể undo!
       this.editor.delete(this.count);
     }

     undo() {
       // ❌ Không biết xóa gì!
     }
   }

   // ✅ Đúng: Lưu deleted text
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

2. **Command quá lớn — làm quá nhiều thứ**
   ```typescript
   // ❌ Sai: Một command làm TẤT CẢ (login + fetch + render)
   class BadCommand implements Command {
     execute() {
       this.login();
       this.fetchData();
       this.render();
     }
   }
   // → Nên chia: LoginCommand, FetchCommand, RenderCommand riêng
   ```

---

## 🎤 Interview Q&A

**Q: Command Pattern là gì? Khi nào dùng?**
> A: Command đóng gói một request/action thành object với method `execute()`. Điều này cho phép queue requests, undo/redo, logging, và macro. Dùng khi cần undo/redo (text editors, IDEs), task queue (job schedulers), hoặc batch operations (macros).

**Q: Command vs Function callback khác nhau gì?**
> A: Callback là function được passed như argument — stateless, không có undo. Command là object với state (data cần thiết để undo) và method `undo()`. Callback dùng khi chỉ cần execute once, không cần reverse. Command dùng khi cần undo, queue, hoặc replay.

**Q: Làm sao implement undo/redo hiệu quả?**
> A: Dùng 2 stacks: `history` (undo) và `future` (redo). Khi execute → push vào history, clear future. Undo → pop từ history, call undo(), push vào future. Redo → pop từ future, call execute(), push vào history. Giới hạn history size (VD: 100 commands) để tránh memory leak.
