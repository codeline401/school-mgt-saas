import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "300 000 Ar",
    period: "/ mois",
    desc: "Pour démarrer avec une petite école.",
    features: [
      "Jusqu'à 500 élèves",
      "Gestion des élèves",
      "Gestion pédagogique",
      "Gestion logistique",
      "Communication",
      "Support par email",
    ],
    featured: false,
  },
  {
    name: "Pro",
    price: "450 000 Ar",
    period: "/ mois",
    desc: "Le choix idéal pour la plupart des écoles avec une taille moyenne.",
    features: [
      "Jusqu'à 1 500 élèves",
      "Gestion des élèves",
      "Gestion pédagogique",
      "Gestion logistique",
      "Communication",
      "Comptabilité & Finance",
      "Ressource Humaines",
      "Support prioritaire",
    ],
    featured: true,
  },
  {
    name: "Premium",
    price: "700 000 Ar",
    period: "/ mois",
    desc: "Pour les groupes scolaires multi-sites.",
    features: [
      "Élèves illimités",
      "Multi-établissements",
      "Gestion des éléves",
      "Gestion pédagogique",
      "Gestion logistique",
      "Communication",
      "Comptabilité & Finance",
      "Ressource Humaines",
      "Intégration d'IA",
      "Support prioritaire",
      "Manager dédié",
    ],
    featured: false,
  },
];

// Cartes de prix ; la formule recommandée est mise en avant
export default function Pricing() {
  return (
    <section id="tarifs" className="scroll-mt-16 bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Des tarifs simples et transparents
          </h2>
          <p className="mt-4 text-slate-600">
            Sans engagement, changez de formule à tout moment.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-xl p-8 ${
                p.featured
                  ? "border-2 border-indigo-600 bg-white shadow-md md:scale-105"
                  : "border border-slate-200 bg-white shadow-sm"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  Recommandé
                </span>
              )}
              <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
              <p className="mt-6">
                <span className="text-4xl font-extrabold text-slate-900">
                  {p.price}
                </span>
                <span className="text-slate-500">{p.period}</span>
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <Check
                      size={18}
                      className="mt-0.5 shrink-0 text-indigo-600"
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={`/register?plan=${p.name.toLowerCase()}`}
                className={`mt-8 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                  p.featured
                    ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Choisir ce plan
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
