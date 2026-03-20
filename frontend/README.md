# Frontend (React + TypeScript + Vite)

This project is a **React 19 + TypeScript frontend** built with **Vite**, styled using **Tailwind CSS**, and configured to communicate with both a backend API and an AI service.

It extends the default Vite template with stricter typing, testing, markdown rendering, and a production-ready structure.

---

## Overview

This application is designed to:

* Connect to a **core backend API** and an **AI service**
* Render dynamic UI using React
* Support **Markdown + GitHub Flavored Markdown (GFM)**
* Provide a fast and modern developer experience with:

  * Hot Module Replacement (HMR)
  * Strict TypeScript configuration
  * Built-in testing and linting

---

## Tech Stack

* **React 19 + React DOM**
* **TypeScript (strict mode)**
* **Vite**
* **React Router (v7)**
* **React Markdown + remark-gfm**
* **Tailwind CSS + Typography plugin**
* **Vitest + Testing Library**
* **ESLint (React + TS + Hooks)**

---

##  Getting Started

### Install dependencies

```bash
npm install
```

---

### Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_AI_API_URL=http://localhost:8000
```

These are used to connect to:

* Backend API
* AI service

---

### Run development server

```bash
npm run dev
```

---
## Available Scripts

```bash
npm run dev       # start dev server
npm run build     # type-check + production build
npm run preview   # preview build
npm run lint      # run ESLint
npm run test      # run Vitest
```

---

##  Build Process

```bash
tsc -b && vite build
```

* TypeScript runs project references build
* Vite bundles the app

---

##  Testing

* Powered by **Vitest**
* Uses **jsdom** environment
* Setup file: `src/_test_/setup.ts`

Run:

```bash
npm run test
```

---

## Styling (Tailwind)

Tailwind is configured with:

* Dark mode via `class`
* Custom theme colors (`primary`, `background-*`, `card-*`)
* Inter font family
* Typography plugin

---

## Linting

Run:

```bash
npm run lint
```

Configured with:

* TypeScript rules
* React Hooks rules
* Vite fast-refresh support

---

## Entry Point

The app mounts to:

```html
<div id="root"></div>
```

and starts from:

```html
/src/main.tsx
```

---

## Vite React Plugins

This project uses the official Vite React plugin:

* [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) (Babel-based Fast Refresh)

Alternatively, you can use:

* [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) (SWC-based Fast Refresh)

---

## React Compiler

The React Compiler is **not enabled** due to its impact on development and build performance.

To enable it, see:
https://react.dev/learn/react-compiler/installation

---

## Expanding ESLint Configuration

For production-grade applications, you may want stricter, type-aware linting.

### Enable type-aware rules

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Replace default config with:
      tseslint.configs.recommendedTypeChecked,
      // or stricter:
      tseslint.configs.strictTypeChecked,
      // optional stylistic rules:
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

---

### Optional React-specific lint rules

You can further enhance linting with:

* eslint-plugin-react-x
* eslint-plugin-react-dom

```js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
  },
])
```

---

## TypeScript Notes

* Strict mode enabled
* Modern targets (ES2022+)
* Bundler module resolution
* Project references:

  * `tsconfig.app.json`
  * `tsconfig.node.json`

---

## Project Notes

* `.gitignore` excludes logs, builds, and local files
* PostCSS is configured with Tailwind + Autoprefixer
* Ready for scaling into a full frontend application

---

## Example Utility

```ts
export default function sum(a: number, b: number) {
  return a + b;
}
```


