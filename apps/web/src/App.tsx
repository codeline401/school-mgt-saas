import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import ElevesPage from "./pages/ElevesPage";
import LoginPage from "./pages/LoginPage";

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
        {/**Toutes les routes à l'intérieur de DashboardLayout partageront la Sidebar  */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardTemp />} />
          <Route path="eleves" element={<ElevesPage />} />

          {/** TODO ajouter Profs et Setting plus tard */}
        </Route>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
