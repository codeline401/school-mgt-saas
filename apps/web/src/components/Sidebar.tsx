import { GraduationCap, LayoutDashboard, Settings, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", path: "/" },
    { icon: GraduationCap, label: "Elèves", path: "/eleves" },
    { icon: Users, label: "Professeurs", path: "/" },
    { icon: Settings, label: "Paramètres", path: "/" },
  ];
  return (
    <div className="w-64 bg-white/5 backdrop-blur-sm h-screen border-r border-white/10 p-4 shrink-0">
      <h2 className="text-xl font-bold text-emerald-400 mb-8 px-2">
        Future School MG
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
