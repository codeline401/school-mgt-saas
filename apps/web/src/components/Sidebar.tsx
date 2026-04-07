import { GraduationCap, LayoutDashboard, Settings, Users } from "lucide-react";

function Sidebar() {
  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard" },
    { icon: GraduationCap, label: "Elèves", path: "/eleves" },
    { icon: Users, label: "Professeurs", path: "/profs" },
    { icon: Settings, label: "Paramètres", path: "/settings" },
  ];
  return (
    <div className="w-64 bg-white h-screen border-r border-gray-400 p-4">
      <h2 className="text-xl font-bold text-blue-400 mb-8 px-2">
        Future School MG
      </h2>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.path}
            className="flex items-center gap-3 p-3 text-grey-700 hover:bg-blue-100 rounded"
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
