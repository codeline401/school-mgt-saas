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
    <div className="w-64 bg-white h-screen border-r border-gray-400 p-4">
      <h2 className="text-xl font-bold text-blue-400 mb-8 px-2">
        Future School MG
      </h2>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-100 rounded ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-blue-100"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
