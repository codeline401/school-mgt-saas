import { GraduationCap, Globe, Mail, MessageCircle } from "lucide-react";

const columns = [
  { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Démo"] },
  { title: "Ressources", links: ["Documentation", "Support", "Contact"] },
  { title: "Légal", links: ["Mentions légales", "Confidentialité", "CGU"] },
];

// Pied de page : liens utiles, mentions légales, réseaux sociaux
export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <a
              href="#"
              className="flex items-center gap-2 font-bold text-slate-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <GraduationCap size={18} />
              </span>
              Hianatra
            </a>
            <p className="mt-3 text-sm text-slate-600">
              La gestion scolaire, simplifiée.
            </p>
          </div>

          {columns.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-slate-900">
                {c.title}
              </h4>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-slate-600 hover:text-indigo-600"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Hianatra. Tous droits réservés.
          </p>
          <div className="flex gap-4 text-slate-500">
            <a href="#" aria-label="Twitter" className="hover:text-indigo-600">
              <Globe size={20} />
            </a>
            <a href="#" aria-label="LinkedIn" className="hover:text-indigo-600">
              <Mail size={20} />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-indigo-600">
              <MessageCircle size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
