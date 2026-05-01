import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import ElevesPage from "./pages/ElevesPage";
import SchoolsPage from "./pages/SchoolPage";
import ClassesPage from "./pages/ClassesPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import EleveProfilPage from "./pages/EleveProfilPage";

const DashboardTemp = () => (
  <div>
    <p className="text-2xl font-bold">Bienvenu(e) sur School Management</p>
    <p className="text-gray-500 mt-2">
      Sélectionnez une section dans le menu pour commencer
    </p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardTemp />} />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "USER", "SUDO_ADMIN"]}
                />
              }
            >
              <Route path="/eleves" element={<ElevesPage />} />
              <Route path="/eleves/:id" element={<EleveProfilPage />} />
            </Route>

            {/* Route écoles : ADMIN crée la sienne, SUDO_ADMIN voit tout */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "SUDO_ADMIN"]} />
              }
            >
              <Route path="/schools" element={<SchoolsPage />} />
            </Route>

            {/* Route classes : tous les utilisateurs authentifiés */}
            <Route path="/classes" element={<ClassesPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
