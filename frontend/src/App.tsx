function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
      <div className="max-w-lg w-full px-6 py-8 bg-slate-800 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-semibold mb-2">
          HR Management Platform Frontend
        </h1>
        <p className="text-sm text-slate-300 mb-4">
          Frontend environment is set up and ready for development. (ur so welcome)
        </p>
        <ul className="text-sm list-disc list-inside space-y-1">
          <li>React + TypeScript</li>
          <li>Vite dev server</li>
          <li>Tailwind CSS configured</li>
          <li>API base URL via environment variables</li>
        </ul>
      </div>
    </div>
  );
}

export default App;

