/**
 * Etat de chargement de l'historique élève.
 */
export function HistoriqueSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="card border border-base-200 bg-base-100 shadow-sm"
        >
          <div className="card-body space-y-3">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
