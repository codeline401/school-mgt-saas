/**
 * Etat de chargement de la carte du contact d'urgence.
 */
export function EmergencyContactSkeleton() {
  return (
    <div className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body space-y-4">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-5 w-72" />
        <div className="skeleton h-12 w-full" />
      </div>
    </div>
  );
}
