import Sidebar from "../components/Sidebar.js";
import UserHeader from "../components/UserHeader.js";
import { Outlet } from "react-router-dom";

function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      {/** Barre latérale fixe sur la gauche */}
      <Sidebar />

      {/** Zone principale */}
      <div className="flex-1 flex flex-col">
        {/** Barre supérieure */}
        <header className="h-14 flex items-center justify-end px-6 border-b border-base-300 bg-base-100/80 backdrop-blur-sm sticky top-0 z-10">
          <UserHeader />
        </header>

        {/** Contenu de la page */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
