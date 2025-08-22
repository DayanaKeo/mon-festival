"use client";
type Props = { open: boolean; onClose: () => void; redirectTo?: string };

export default function LoginPromptModal({ open, onClose, redirectTo = "/events" }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-white">Connecte-toi pour activer un rappel</h3>
        <p className="mt-1 text-sm text-slate-300">Les rappels sont envoyés par email et notif temps réel.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Annuler</button>
          <a href={`/login?callbackUrl=${encodeURIComponent(redirectTo)}`} className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white hover:from-fuchsia-500 hover:to-violet-500">
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
}
