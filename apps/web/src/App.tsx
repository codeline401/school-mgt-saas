import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import ElevesPage from "./pages/ElevesPage";
import LoginPage from "./pages/LoginPage";

// ProtectedRoute est un composant qui vérifie si l'utilisateur est connecté et a les rôles nécessaires pour accéder à une route
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";

// Composant temp pour le Dashboard vide
const DashboardTemp = () => (
  <div>
    <p className="text-2xl font-bold ">Bievenu(e) sur School Management</p>
    <p className="text-gray-500 mt-2">
      Sélectionnez une section dans le menu pour commencer
    </p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/** Route publique : accéssible sans être connecté */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/** Routes protégées : accéssible uniquement si connecté */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/** Acceuil pour tous les connectés */}
            <Route path="/" element={<DashboardTemp />} />

            {/** Section élèves : accessible seulement pour les ADMIN, USER et SUDO_ADMIN */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "USER", "SUDO_ADMIN"]}
                />
              }
            >
              <Route path="/eleves" element={<ElevesPage />} />
            </Route>

            {/** TODO: ajouter /profs, /classes, /settings plus tard */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
