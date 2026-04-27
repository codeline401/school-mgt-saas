import Sidebar from "../components/Sidebar.js"; // Import Sidebar component
import { Outlet } from "react-router-dom"; // Import Outlet for nested routing

function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      {/**Barre latérale fixe sur la gauche */}
      <Sidebar />

      {/**Zone principale qui change selon l'URL */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />{" "}
          {/**Affiche le composant correspondant à la route actuelle */}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
