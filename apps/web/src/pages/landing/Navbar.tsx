import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Menu, X } from "lucide-react";

const links = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "À propos", href: "#apropos" },
];

// En-tête fixe avec menu burger sur mobile
export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-2 text-lg font-bold text-slate-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap size={20} />
          </span>
          Hianatra
        </a>

        {/* Liens ancrés (desktop) */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Connexion
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            Inscription
          </Link>
        </div>

        {/* Bouton burger (mobile) */}
        <button
          className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Menu mobile */}
      {open && (
        <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-3">
            <Link
              to="/login"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white"
            >
              Inscription
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
