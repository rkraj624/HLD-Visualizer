# Rate Limiter Visualizer ⚡

An interactive High-Level System Design (HLD) web application that visually simulates, benchmarks, and explains the core Rate Limiting algorithms used in modern distributed systems and microservices.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.2-purple?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss)

---

## 🌟 Features

### 1. ⚙️ Interactive Algorithm Simulations
Visualizes five fundamental rate-limiting algorithms in real-time:
* **Token Bucket**: Simulates continuous token accumulation and instantaneous burst consumption.
* **Leaky Bucket**: Demonstrates smooth, constant-rate egress queue processing.
* **Fixed Window Counter**: Shows requests counted per discrete time window reset.
* **Sliding Window Log**: Logs exact timestamps to enforce strict boundary enforcement.
* **Sliding Window Counter**: Blends previous and current window counters to eliminate edge spikes efficiently.

### 2. 🎛️ Dynamic Traffic Generator & Controls
* **Traffic Patterns**: Test under **Steady**, **Spike**, **Wave**, and **DDoS** attack traffic scenarios.
* **Simulation Speed**: Adjustable execution speeds (`0.5x`, `1x`, `2x`, `5x`).
* **Manual Request Injection**: Trigger single or burst requests manually to inspect exact behavior.

### 3. 📊 Real-Time Metrics & Logs
* Live Request-per-Second (RPS) gauges and capacity metrics.
* Historical charts displaying allowed vs. rejected traffic ratios.
* Searchable request log table capturing Client IP, Latency, Status (`allowed` / `rejected`), and drop reasons.

### 4. 🧪 Stress-Test Benchmark Engine
* Run automated stress tests to compute algorithm efficiency score, drop rates, and overall resilience under simulated load.

### 5. 💻 Production Code Snippets & Architecture Guides
* Ready-to-use production code implementations in **Python**, **Go**, **TypeScript / Node.js**, and **Redis + Lua**.
* Deep-dive educational guides explaining trade-offs, distributed locks, memory footprints, and edge cases.

### 6. ⚖️ Comparison Matrix
* Side-by-side comparative breakdown of Time Complexity, Space Complexity, Burst Support, and Distributed System Scalability.

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
Open your browser and navigate to `http://localhost:5173` (or the port specified in your terminal).

---

## 🛠️ Available Scripts

In the project directory, you can run:

* `npm run dev`: Starts the Vite development server with Hot Module Replacement (HMR).
* `npm run build`: Compiles TypeScript files and builds the optimized production bundle.
* `npm run preview`: Bootstraps a local web server to preview the production build.
* `npm run lint`: Runs `oxlint` to check code quality and static analysis.

---

## 📂 Project Structure

```text
HLD Visualizer/
├── public/                 # Static assets & icons
├── src/
│   ├── components/         # UI Components
│   │   ├── AlgorithmSelector.tsx
│   │   ├── CodeSnippets.tsx
│   │   ├── ComparisonMatrix.tsx
│   │   ├── ControlsPanel.tsx
│   │   ├── EducationalGuide.tsx
│   │   ├── Header.tsx
│   │   ├── MetricsDashboard.tsx
│   │   └── VisualizerCanvas.tsx
│   ├── utils/              # Core logic & algorithms
│   │   ├── audio.ts        # Sound FX generation
│   │   ├── codeSnippets.ts # Multi-language code snippets
│   │   ├── constants.ts    # Presets & configuration
│   │   ├── explanations.ts # Deep-dive documentation
│   │   └── rateLimiters.ts # Pure rate limiter algorithm logic
│   ├── App.tsx             # Main application orchestrator
│   ├── index.css           # Styling system & Tailwind CSS rules
│   ├── main.tsx            # Application entrypoint
│   └── types.ts            # TypeScript interfaces & types
├── .gitignore              # Git ignore rules
├── package.json            # Project dependencies & scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

---

## 🛠️ Built With

* **[React 19](https://react.dev/)**: UI rendering library
* **[TypeScript](https://www.typescriptlang.org/)**: Type-safe development
* **[Vite](https://vitejs.dev/)**: Fast frontend build tool
* **[Tailwind CSS v4](https://tailwindcss.com/)**: Modern utility-first styling
* **[Lucide React](https://lucide.dev/)**: Clean icon suite
* **Web Audio API**: Browser-native sound synthesis for request alerts

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
