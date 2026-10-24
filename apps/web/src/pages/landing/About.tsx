import { Target, HeartHandshake } from "lucide-react";

// Bloc de confiance : mission et vision
export default function About() {
  return (
    <section id="apropos" className="scroll-mt-16 bg-white py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Notre mission</h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            Nous sommes une équipe d'éducateurs et d'ingénieurs convaincus que la technologie doit
            alléger l'administratif pour que les écoles se consacrent à ce qui compte : les élèves.
          </p>
          <p className="mt-4 leading-relaxed text-slate-600">
            Notre vision : un outil simple, fiable et accessible à tous les établissements, quelle que soit leur taille.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <Target className="text-indigo-600" size={28} />
            <h3 className="mt-3 font-semibold text-slate-900">Notre objectif</h3>
            <p className="mt-1 text-sm text-slate-600">Simplifier la gestion scolaire au quotidien.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <HeartHandshake className="text-indigo-600" size={28} />
            <h3 className="mt-3 font-semibold text-slate-900">Nos valeurs</h3>
            <p className="mt-1 text-sm text-slate-600">Transparence, écoute et accompagnement.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
