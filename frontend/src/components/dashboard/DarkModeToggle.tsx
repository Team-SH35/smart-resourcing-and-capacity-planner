export default function DarkModeToggle() {
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      aria-label="Toggle dark mode"
    >
      <span className="material-icons-outlined">dark_mode</span>
    </button>
  );
}
