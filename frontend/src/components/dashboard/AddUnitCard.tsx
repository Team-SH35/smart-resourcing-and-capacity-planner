interface AddUnitCardProps {
  onClick?: () => void;
}

export default function AddUnitCard({ onClick }: AddUnitCardProps) {
  return (
    <button
      onClick={onClick}
      className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:border-primary hover:text-primary transition-all bg-transparent group"
    >
      <span className="material-icons-outlined group-hover:scale-110 transition-transform">add</span>
      <span className="font-semibold">Add unit</span>
    </button>
  );
}
