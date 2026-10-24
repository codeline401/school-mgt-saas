import { Zap, ShieldCheck, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Gain de temps",
    text: "Automatisez inscriptions, bulletins et relances de paiement pour vous concentrer sur l'essentiel.",
  },
  {
    icon: ShieldCheck,
    title: "Données sécurisées",
    text: "Accès par rôles, sauvegardes régulières et protection des informations des élèves et des familles.",
  },
  {
    icon: BarChart3,
    title: "Pilotage en temps réel",
    text: "Tableaux de bord clairs sur les effectifs, les résultats et la trésorerie de votre établissement.",
  },
];

// Grille de 3 avantages clés
export default function Features() {
  return (
    <section id="fonctionnalites" className="scroll-mt-16 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Pourquoi nous choisir ?</h2>
          <p className="mt-4 text-slate-600">Tout ce qu'il faut pour moderniser la gestion de votre école.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Icon size={24} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
