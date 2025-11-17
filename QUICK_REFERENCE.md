# 🚀 Quick Reference Guide - File Manager Project

> A cheat sheet for understanding your code structure, variables, and key concepts

---

## 📦 **Data Structures (Types)**

### **FileInfo** - Information about a single file
Location: `src/types/type.ts`

```typescript
interface FileInfo {
  name: string;           // "document.pdf"
  path: string;           // "C:\Downloads\document.pdf"
  size: number;           // 1024000 (bytes)
  extension: string;      // ".pdf"
  createdAt: Date;        // When file was created
  modifiedAt: Date;       // When file was last modified
}
```

**Example:**
```typescript
const file: FileInfo = {
  name: "report.pdf",
  path: "C:\\Downloads\\report.pdf",
  size: 2048000,
  extension: ".pdf",
  createdAt: new Date("2025-11-01"),
  modifiedAt: new Date("2025-11-15")
}
```

---

### **ScanResult** - Result from scanning a folder
Location: `src/types/type.ts`

```typescript
interface ScanResult {
  files: FileInfo[];      // Array of all files found
  totalFiles: number;     // Count of files
  scannedAt: Date;        // When scan was performed
  scannedPath: string;    // Path that was scanned
}
```

**Example:**
```typescript
const result: ScanResult = {
  files: [file1, file2, file3],
  totalFiles: 3,
  scannedPath: "C:\\Downloads",
  scannedAt: new Date()
}
```

**How to access:**
```typescript
result.files           // Array of FileInfo objects
result.files[0]        // First file
result.files.length    // Number of files
result.totalFiles      // Same as files.length
result.scannedPath     // The folder that was scanned
```

---

## 🔧 **Important Variables**

### **In Route Handler (`/scan`)**

```typescript
fastify.get<{Querystring: ScanQuery}>('/scan', async(request, reply) => {
  const {path, extension} = request.query  // 👈 From URL query params
  
  const result = await scanInfo(path)      // 👈 Returns ScanResult
  
  // result contains:
  // - result.files (array)
  // - result.totalFiles (number)
  // - result.scannedPath (string)
  // - result.scannedAt (Date)
})
```

### **Query Parameters**

```typescript
interface ScanQuery {
  path: string;         // Required
  extension?: string;   // Optional (? means optional)
}
```

**Example URLs:**
```
/scan?path=C:\Downloads
/scan?path=C:\Downloads&extension=.pdf
```

**Accessing:**
```typescript
request.query.path        // "C:\Downloads"
request.query.extension   // ".pdf" or undefined
```

---

## 📊 **Array Methods You're Using**

### **`.filter()` - Keep items that match a condition**

```typescript
// Original array
const numbers = [1, 2, 3, 4, 5];

// Filter even numbers
const evenNumbers = numbers.filter(num => num % 2 === 0);
// Result: [2, 4]

// Original array is NOT modified
console.log(numbers); // Still [1, 2, 3, 4, 5]
```

**Your Code:**
```typescript
result.files = result.files.filter(file => 
  file.extension.toLowerCase() === extension.toLowerCase()
);
```

**What it does:**
1. Goes through each file in `result.files`
2. Checks if `file.extension` matches the requested `extension`
3. Returns a NEW array with only matching files
4. Assigns it back to `result.files`

---

### **`.map()` - Transform each item** (You used this in scanner)

```typescript
const numbers = [1, 2, 3];
const doubled = numbers.map(num => num * 2);
// Result: [2, 4, 6]
```

**Your Code (in scannerInfo.ts):**
```typescript
const filesMetadata = await Promise.all(
  fileNames.map(async (fileName) => {
    // Transform fileName into FileInfo object
    return fileInfo;
  })
);
```

---

### **`.toLowerCase()` - Convert string to lowercase**

```typescript
const ext = ".PDF";
ext.toLowerCase()  // ".pdf"

// Use for case-insensitive comparison
".PDF".toLowerCase() === ".pdf".toLowerCase()  // true
```

---

## 🎯 **Key Concepts**

### **1. Optional vs Required**

```typescript
interface Example {
  required: string;     // Must be provided
  optional?: string;    // Can be undefined
}

// Valid:
const obj1: Example = { required: "hello" };
const obj2: Example = { required: "hello", optional: "world" };

// Invalid:
const obj3: Example = { optional: "world" }; // ❌ Missing required
```

### **2. Async/Await**

```typescript
// ❌ Wrong - doesn't wait
const result = scanInfo(path);  // Returns Promise, not ScanResult

// ✅ Right - waits for completion
const result = await scanInfo(path);  // Returns actual ScanResult
```

### **3. Object Destructuring**

```typescript
// Instead of:
const path = request.query.path;
const extension = request.query.extension;

// Write:
const {path, extension} = request.query;
```

### **4. Conditional Logic**

```typescript
if (extension) {
  // This runs ONLY if extension exists (not undefined)
  result.files = result.files.filter(...);
}

// If extension is undefined, filtering is skipped
```

---

## 🛣️ **Request Flow**

```
1. User visits: /scan?path=C:\Downloads&extension=.pdf

2. Fastify receives request
   ↓
3. Route handler extracts: {path, extension}
   ↓
4. Call: await scanInfo(path)
   ↓
5. Scanner reads folder, returns ScanResult
   ↓
6. IF extension exists:
   - Filter result.files
   - Update result.totalFiles
   ↓
7. Send result back as JSON
```

---

## 📁 **File Structure Reference**

```
src/
├── types/
│   └── type.ts              # FileInfo, ScanResult interfaces
│
├── services/
│   └── scannerInfo.ts       # scanInfo() function
│
├── lib/
│   └── logger.ts            # logger utility
│
└── index.ts                 # Fastify routes
```

---

## 🔍 **Common Debugging**

### **Check what's in result:**
```typescript
console.log(result);
// {
//   files: [ ... ],
//   totalFiles: 105,
//   scannedPath: "C:\\Downloads",
//   scannedAt: 2025-11-15T...
// }
```

### **Check first file:**
```typescript
console.log(result.files[0]);
// {
//   name: "document.pdf",
//   path: "C:\\Downloads\\document.pdf",
//   size: 1024000,
//   extension: ".pdf",
//   ...
// }
```

### **Check if extension exists:**
```typescript
console.log(extension);        // ".pdf" or undefined
console.log(extension ? "Has extension" : "No extension");
```

### **Check filtered results:**
```typescript
console.log('Before filter:', result.files.length);
result.files = result.files.filter(...);
console.log('After filter:', result.files.length);
```

---

## 💡 **Important Reminders**

### **1. File Extensions Include the Dot**
```typescript
// ✅ Correct
extension === ".pdf"

// ❌ Wrong
extension === "pdf"
```

### **2. Arrays Start at 0**
```typescript
result.files[0]     // First file
result.files[1]     // Second file
result.files.length // Total count
```

### **3. Strings are Immutable**
```typescript
const ext = ".PDF";
ext.toLowerCase();  // Returns ".pdf" but doesn't change ext
console.log(ext);   // Still ".PDF"

// You need to assign:
const lower = ext.toLowerCase();
console.log(lower); // ".pdf"
```

### **4. Filter Creates New Array**
```typescript
const original = [1, 2, 3, 4];
const filtered = original.filter(x => x > 2);

console.log(original);  // [1, 2, 3, 4] - unchanged
console.log(filtered);  // [3, 4] - new array

// But if you assign:
original = original.filter(x => x > 2);
console.log(original);  // [3, 4] - now modified
```

---

## 🧪 **Test Cases**

### **Test 1: All files**
```
URL: /scan?path=C:\Downloads
Result: All 105 files
```

### **Test 2: Filter PDFs**
```
URL: /scan?path=C:\Downloads&extension=.pdf
Result: Only .pdf files
Check: result.totalFiles should match result.files.length
```

### **Test 3: Case insensitive**
```
URL: /scan?path=C:\Downloads&extension=.PDF
Result: Same as Test 2 (because of .toLowerCase())
```

### **Test 4: No matches**
```
URL: /scan?path=C:\Downloads&extension=.xyz
Result: files: [], totalFiles: 0
```

---

## 📚 **Quick TypeScript Reference**

### **Type Annotations**
```typescript
const name: string = "John";
const age: number = 25;
const isActive: boolean = true;
const items: string[] = ["a", "b", "c"];
const data: FileInfo = { name: "...", ... };
```

### **Optional Properties**
```typescript
property?: string    // Can be string or undefined
```

### **Generic Types**
```typescript
fastify.get<{ Querystring: ScanQuery }>
//           ↑ This tells TypeScript what request.query looks like
```

### **Type Inference**
```typescript
// TypeScript infers types automatically:
const result = await scanInfo(path);  // TS knows result is ScanResult
const filtered = result.files.filter(...);  // TS knows filtered is FileInfo[]
```

---

## 🎓 **What You've Learned So Far**

- ✅ Defining TypeScript interfaces
- ✅ Working with arrays (`.filter()`, `.map()`)
- ✅ Async/await patterns
- ✅ Fastify route handlers
- ✅ Query parameters
- ✅ Optional properties (`?`)
- ✅ Object destructuring
- ✅ String methods (`.toLowerCase()`)
- ✅ Conditional logic
- ✅ File system operations

---

## 🚀 **Next Features**

Once you're comfortable with filtering by extension, try:
1. **Sort by size:** `?sortBy=size`
2. **Filter by date:** `?after=2025-11-01`
3. **Multiple extensions:** `?extensions=.pdf,.docx,.txt`
4. **Limit results:** `?limit=10`

---

**Keep this file handy! Update it as you learn new patterns.** 📖
