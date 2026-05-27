import { useState } from "react";
import {
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  NotebookPen,
  Package,
  Settings,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

type Role = "SUDO_ADMIN" | "ADMIN" | "USER" | "PROF" | "ELEVE" | "PARENT";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: Role[] | null;
}

interface NavGroup {
  icon: React.ElementType;
  label: string;
  roles: Role[] | null;
  children: NavItem[];
}

interface NavPlaceholder {
  icon: React.ElementType;
  label: string;
}

type MenuEntry = NavItem | NavGroup | NavPlaceholder;

function isGroup(entry: MenuEntry): entry is NavGroup {
  return "children" in entry;
}
function isItem(entry: MenuEntry): entry is NavItem {
  return "path" in entry && !("children" in entry);
}

const MENU: MenuEntry[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard & Stats",
    path: "/",
    roles: null,
  },
  {
    icon: BookOpen,
    label: "Gestion Pédagogique",
    roles: null,
    children: [
      { icon: GraduationCap, label: "Élèves", path: "/eleves", roles: null },
      { icon: BookOpen, label: "Classes", path: "/classes", roles: null },
      {
        icon: Users,
        label: "Professeurs",
        path: "/professeurs",
        roles: ["ADMIN", "SUDO_ADMIN", "USER"],
      },
      {
        icon: ClipboardList,
        label: "Notes & Examens",
        path: "/notes-examens",
        roles: null,
      },
      {
        icon: NotebookPen,
        label: "Cahier de texte",
        path: "/cahier-texte",
        roles: null,
      },
    ],
  },
  { icon: Wallet, label: "Comptabilité & Finance" },
  { icon: Briefcase, label: "Ressources Humaines" },
  {
    icon: Building2,
    label: "Administration École",
    path: "/schools",
    roles: ["SUDO_ADMIN", "ADMIN"],
  },
  { icon: MessageSquare, label: "Communication" },
  { icon: Package, label: "Gestion Logistique" },
  {
    icon: UserCircle,
    label: "Mon profil",
    path: "/mon-profil",
    roles: ["PROF"],
  },
  { icon: Settings, label: "Paramètres", path: "/parametres", roles: null },
];

const BASE =
  "flex items-center gap-3 p-3 rounded-lg transition-colors text-sm";
const ACTIVE = "bg-white/10 text-white font-semibold";
const IDLE = "text-white/60 hover:bg-white/5 hover:text-white/90";
const DISABLED = "text-white/25 cursor-default px-3 py-2 text-sm flex items-center gap-3";
const SUB = "flex items-center gap-3 pl-8 py-2 pr-3 rounded-lg transition-colors text-sm";

function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    // Open the group that contains the active route on first render
    const active = MENU.filter(isGroup).find((g) =>
      g.children.some(
        (c) => location.pathname === c.path || location.pathname.startsWith(c.path + "/"),
      ),
    );
    return active ? [active.label] : [];
  });

  const toggle = (label: string) =>
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );

  const hasAccess = (roles: Role[] | null) =>
    roles === null || (!!user && roles.includes(user.role as Role));

  return (
    <div className="w-64 bg-white/5 backdrop-blur-sm h-screen border-r border-white/10 p-4 shrink-0 flex flex-col">
      <h2 className="text-xl font-bold text-emerald-400 mb-8 px-2">
        School SaaS MG
      </h2>

      <nav className="space-y-0.5 flex-1 overflow-y-auto">
        {MENU.map((entry) => {
          /* ── Placeholder (pas de route, pas encore implémenté) ── */
          if (!isGroup(entry) && !isItem(entry)) {
            return (
              <div key={entry.label} className={DISABLED} title="Bientôt disponible">
                <entry.icon className="w-5 h-5 shrink-0 opacity-50" />
                <span>{entry.label}</span>
                <span className="ml-auto text-[10px] bg-white/10 rounded px-1 py-0.5 leading-none">
                  Soon
                </span>
              </div>
            );
          }

          /* ── Groupe avec sous-menus ── */
          if (isGroup(entry)) {
            if (!hasAccess(entry.roles)) return null;

            // Filter children by role
            const children = entry.children.filter((c) =>
              hasAccess(c.roles),
            );
            if (children.length === 0) return null;

            const isOpen = openGroups.includes(entry.label);
            const hasActive = children.some(
              (c) => location.pathname === c.path || location.pathname.startsWith(c.path + "/"),
            );

            return (
              <div key={entry.label}>
                <button
                  onClick={() => toggle(entry.label)}
                  className={`w-full ${BASE} ${hasActive && !isOpen ? ACTIVE : IDLE}`}
                >
                  <entry.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">{entry.label}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 opacity-60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  )}
                </button>

                {isOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `${SUB} ${isActive ? ACTIVE : IDLE}`
                        }
                      >
                        <child.icon className="w-4 h-4 shrink-0" />
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          /* ── Item simple ── */
          if (!hasAccess(entry.roles)) return null;
          return (
            <NavLink
              key={entry.path}
              to={entry.path}
              end={entry.path === "/"}
              className={({ isActive }) =>
                `${BASE} ${isActive ? ACTIVE : IDLE}`
              }
            >
              <entry.icon className="w-5 h-5 shrink-0" />
              <span>{entry.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;

