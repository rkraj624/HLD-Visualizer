# System Craft HLD & SQL Mastery Visualizer ⚡

An interactive High-Level System Design (HLD) & SQL Practice application that visually simulates distributed system architectures, benchmarks core rate-limiting algorithms, and provides an end-to-end level-based SQL practice game.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.2-purple?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss)

---

## 🌟 Key Features

### 1. 🌐 Interactive HLD Topology Graph
* **Drag-and-Drop Node Customization**: Drag system components (Client, Gateway, Cache, Rate Limiter, DB Cluster, Queue) on an interactive canvas with saved positions.
* **Stage-Based Pipeline Architecture**: Visualizes end-to-end traffic flow across 4 core stages (Client Tier → Gateway Tier → Microservice Core → Data Engine).

### 2. 🗄️ Level-Based SQL Practice Studio & Stateful Engine
* **50+ Real-World SQL Practice Challenges**: Extracted from standard SQL interview sets covering `emp`, `dept`, and `salgrade` schemas.
* **Stateful In-Memory Query Engine**: Supports live execution of `SELECT`, `INSERT INTO`, `DELETE`, `JOIN`, `GROUP BY`, and `HAVING` queries without precomputed static mocks.
* **Smart Autocomplete & Keyword Engine**: Floating popover auto-suggests SQL keywords (`SELECT`, `WHERE`, `GROUP BY`, `HAVING`, `LIMIT`, `JOIN`), table names, and column identifiers with `Tab` / `Enter` completion.
* **Level Progression & XP System**: Unlocks questions sequentially with progress and XP tracking persisted in `localStorage`.
* **Sidebar Layout & Expected Result Comparison**: Side-by-side tabs for **Your Output** vs **Expected Result** tables, and tabbed toggle between **Questions Bank** and **DB Schema Explorer**.

### 3. ⚙️ Interactive Rate Limiting Algorithm Simulators
Visualizes five fundamental rate-limiting algorithms in real-time:
* **Token Bucket**: Simulates continuous token accumulation and instantaneous burst consumption.
* **Leaky Bucket**: Demonstrates smooth, constant-rate egress queue processing.
* **Fixed Window Counter**: Shows requests counted per discrete time window reset.
* **Sliding Window Log**: Logs exact timestamps to enforce strict boundary enforcement.
* **Sliding Window Counter**: Blends previous and current window counters to eliminate edge spikes efficiently.

### 4. 🎛️ Dynamic Traffic Generator & Benchmark Engine
* **Traffic Patterns**: Test under **Steady**, **Spike**, **Wave**, and **DDoS** attack traffic scenarios.
* **Stress-Test Benchmarking**: Automated load runner calculating drop rates, efficiency scores, and throughput metrics.

### 5. 💻 Production Code Snippets & Architecture Guides
* Production code implementations in **Python**, **Go**, **TypeScript / Node.js**, and **Redis + Lua**.

---

## 📐 Algorithm Overview

| Algorithm | Time Complexity | Space Complexity | Burst Support | Distributed Scalability | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Token Bucket** | $O(1)$ | $O(1)$ | ✅ High | 🟢 High (Redis) | API gateways, AWS Rate Limiting |
| **Leaky Bucket** | $O(1)$ | $O(N)$ | ❌ No (Smooth) | 🟡 Medium | Egress queues, smooth data streaming |
| **Fixed Window** | $O(1)$ | $O(1)$ | ⚠️ Edge Spikes | 🟢 High | Simple IP/User tier quotas |
| **Sliding Log** | $O(\log N)$ | $O(N)$ | ✅ High | 🔴 Low (Memory heavy)| Strict security/auth endpoints |
| **Sliding Counter** | $O(1)$ | $O(1)$ | ✅ Moderate | 🟢 High | Cloudflare / High-scale edge proxies |

---

## 🚀 Getting Started

### Prerequisites
Make sure you have **Node.js** (v18.0.0 or higher) and **npm** installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/rkraj624/HLD-Visualizer.git
cd HLD-Visualizer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🛠️ Available Scripts

In the project directory, you can run:

* `npm run dev`: Starts the Vite development server.
* `npm run build`: Compiles TypeScript files and builds the production bundle.
* `npm run preview`: Bootstraps local server to preview production build.

---

## 📂 Project Structure

```text
HLD Visualizer/
├── public/                 # Static assets & icons
├── src/
│   ├── components/         # UI Components
│   │   ├── LandingPage.tsx           # Main HLD topology canvas & intro
│   │   ├── SqlPlaygroundSection.tsx  # Pure SQL intro & studio launcher
│   │   ├── SqlEditorModal.tsx        # Full-screen level progression SQL game & engine
│   │   ├── AlgorithmSelector.tsx
│   │   ├── CodeSnippets.tsx
│   │   ├── ComparisonMatrix.tsx
│   │   ├── ControlsPanel.tsx
│   │   ├── EducationalGuide.tsx
│   │   ├── Header.tsx
│   │   ├── MetricsDashboard.tsx
│   │   └── VisualizerCanvas.tsx
│   ├── data/
│   │   └── sqlQuestions.json  # 50+ Structured SQL practice questions
│   ├── utils/              # Core logic & algorithms
│   │   ├── audio.ts        # Sound FX generation
│   │   ├── codeSnippets.ts # Multi-language code snippets
│   │   ├── constants.ts    # Presets & configuration
│   │   ├── explanations.ts # Deep-dive documentation
│   │   └── rateLimiters.ts # Pure rate limiter algorithm logic
│   ├── App.tsx             # Main application orchestrator
│   ├── index.css           # Styling system, dark scrollbars & Tailwind rules
│   ├── main.tsx            # Application entrypoint
│   └── types.ts            # TypeScript interfaces & types
├── package.json            # Project dependencies & scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
