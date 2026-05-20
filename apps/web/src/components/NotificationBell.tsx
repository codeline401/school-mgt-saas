import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Notification } from "@school-mgt/types";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/api/notifications");
      return data;
    },
    refetchInterval: 30_000, // polling toutes les 30s
  });

  const unread = notifications.filter((n) => !n.lu).length;

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }), // Invalide le cache pour forcer le rafraîchissement des notifications après la mutation
  });

  const markAll = useMutation({
    mutationFn: () => api.patch("/api/notifications/read-all"),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }), // Invalide le cache pour forcer le rafraîchissement des notifications après la mutation
  });

  // Fermer le dropdown si clic extérieur
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  function handleClick(notif: Notification) {
    if (!notif.lu) {
      markOne.mutate(notif.id); // Marque la notification comme lue si elle ne l'était pas déjà
    }
    if (notif.lien) {
      navigate(notif.lien); // Navigue vers le lien associé à la notification si celui-ci existe
      setOpen(false); // Ferme le dropdown après la navigation
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        className="btn btn-ghost btn-sm btn-circle relative"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 badge badge-error badge-xs text-[10px] min-w-4 h-4 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-xl shadow-xl border border-base-200 z-50">
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => markAll.mutate()}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-base-200">
            {notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-base-content/40">
                Aucune notification
              </li>
            )}
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`px-4 py-3 text-sm cursor-pointer hover:bg-base-200 transition-colors ${!n.lu ? "bg-primary/5 font-medium" : ""}`}
                onClick={() => handleClick(n)}
              >
                <p className="leading-snug">{n.message}</p>
                <p className="text-xs text-base-content/40 mt-0.5">
                  {new Date(n.createdAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
