import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  PlayCircle,
  Users,
  TrendingUp,
  BookOpen,
  Wallet,
} from "lucide-react";

const stats = [
  {
    icon: Users,
    label: "Élèves",
    value: "1 248",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: BookOpen,
    label: "Classes",
    value: "36",
    color: "bg-sky-100 text-sky-600",
  },
  {
    icon: Wallet,
    label: "Encaissé",
    value: "12,4 M",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: TrendingUp,
    label: "Réussite",
    value: "94 %",
    color: "bg-amber-100 text-amber-600",
  },
];

// Mots du vocabulaire scolaire qui défilent dans le badge
const words = [
  "Élèves",
  "Parents",
  "Notes",
  "Circulaires",
  "Emploi du temps",
  "Bulletins",
  "Absences",
  "Professeurs",
  "Classes",
  "Examens",
  "Cahier de texte",
  "Écolage",
  "Cantine",
  "Transport",
];

// Section d'accroche : badge, titre, CTA et mockup du tableau de bord
export default function Hero() {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number>();
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Largeur du badge = largeur du mot affiché
  useEffect(() => {
    setWidth(wordRefs.current[index]?.offsetWidth);
  }, [index]);
  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      2000,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white pt-32 pb-16 sm:pt-40">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm">
          <span>Tout pour vos</span>
          {/* Fenêtre d'une ligne : la colonne de mots glisse verticalement */}
          <span
            className="relative block h-5 overflow-hidden text-left font-semibold text-indigo-600 transition-[width] duration-500 ease-in-out"
            style={{ width }}
          >
            <span
              className="absolute left-0 top-0 block transition-transform duration-500 ease-in-out"
              style={{ transform: `translateY(-${index * 20}px)` }}
            >
              {words.map((w, i) => (
                <span
                  key={w}
                  ref={(el) => {
                    wordRefs.current[i] = el;
                  }}
                  className="block h-5 w-max leading-5"
                >
                  {w}
                </span>
              ))}
            </span>
          </span>
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Gérez votre école simplement,{" "}
          <span className="text-indigo-600">de A à Z</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Élèves, notes, comptabilité, personnel et communication : une
          plateforme unique pour piloter votre établissement et gagner un temps
          précieux au quotidien.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            Commencer gratuitement <ArrowRight size={18} />
          </Link>
          <a
            href="#fonctionnalites"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <PlayCircle size={18} /> Voir une démo
          </a>
        </div>

        {/* Mockup du tableau de bord */}
        <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-indigo-200/50">
          <div className="rounded-xl bg-slate-50 p-4 sm:p-6">
            {/* Barre de fenêtre */}
            <div className="mb-4 flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {stats.map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl bg-white p-4 text-left shadow-sm"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}
                  >
                    <Icon size={18} />
                  </span>
                  <p className="mt-3 text-xl font-bold text-slate-900">
                    {value}
                  </p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Faux graphique */}
            <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex h-40 items-end gap-2 sm:gap-3">
                {[40, 65, 50, 80, 60, 90, 75, 95, 70, 85, 100, 88].map(
                  (h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400"
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
