import {
  BookOpen,
  Building2,
  GraduationCap,
  LayoutDashboard,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function Sidebar() {
  const user = useAuthStore((state) => state.user);

  const allMenuItems = [
    {
      icon: LayoutDashboard,
      label: "Tableau de bord",
      path: "/",
      roles: null as string[] | null,
    },
    { icon: GraduationCap, label: "Elèves", path: "/eleves", roles: null },
    { icon: BookOpen, label: "Classes", path: "/classes", roles: null },
    {
      icon: Building2,
      label: "Écoles",
      path: "/schools",
      roles: ["SUDO_ADMIN", "ADMIN"],
    },
    { icon: Users, label: "Professeurs", path: "/professeurs", roles: ["ADMIN", "SUDO_ADMIN", "USER"] },
    { icon: UserCircle, label: "Mon profil", path: "/mon-profil", roles: ["PROF"] },
    { icon: Settings, label: "Paramètres", path: "/parametres", roles: null },
  ];

  const menuItems = allMenuItems.filter(
    (item) => item.roles === null || (user && item.roles.includes(user.role)),
  );
  return (
    <div className="w-64 bg-white/5 backdrop-blur-sm h-screen border-r border-white/10 p-4 shrink-0">
      <h2 className="text-xl font-bold text-emerald-400 mb-8 px-2">
        School SaaS MG
      </h2>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
