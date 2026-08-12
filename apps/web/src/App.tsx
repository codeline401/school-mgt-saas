import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import DashboardLayout from "./layouts/DashboardLayout";
import ElevesPage from "./pages/ElevesPage";
import SchoolsPage from "./pages/SchoolPage";
import ClassesPage from "./pages/ClassesPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import EleveProfilPage from "./pages/EleveProfilPage";
import ProfesseurProfilPage from "./pages/ProfesseurProfilPage";
import ProfesseursPage from "./pages/ProfesseurPage";
import ParentProfilPage from "./pages/ParentProfilPage";
import ClasseProfilPage from "./pages/ClasseProfilPage";
import MonProfilProfPage from "./pages/MonProfilProfPage";
import NotesExamensPage from "./pages/NotesExamensPage";
import CahierTextePage from "./pages/CahierTextePage";
import ParametresPage from "./pages/ParametresPage";
import GestionElevesPage from "./modules/eleves/GestionElevesPage";
import LocauxTab from "./modules/logistique/LocauxTab";
import StocksTab from "./modules/logistique/StocksTab";
import InventaireTab from "./modules/logistique/InventaireTab";
import MaintenanceTab from "./modules/logistique/MaintenanceTab";
import TransportsTab from "./modules/logistique/TransportsTab";
import CantineTab from "./modules/logistique/CantineTab";
import ComptabilitePage from "./modules/comptabilite/ComptabilitePage";
import PersonnelTab from "./modules/rh/PersonnelTab";
import PaieTab from "./modules/rh/PaieTab";
import CongesTab from "./modules/rh/CongesTab";
import ContratsTab from "./modules/rh/ContratsTab";
import FormationsTab from "./modules/rh/FormationsTab";
import EvaluationsTab from "./modules/rh/EvaluationsTab";
import MessagerieTab from "./modules/communication/MessagerieTab";
import NotificationsTab from "./modules/communication/NotificationsTab";
import SmsTab from "./modules/communication/SmsTab";
import ReunionsTab from "./modules/communication/ReunionsTab";
import DocumentsTab from "./modules/communication/DocumentsTab";
import CirculairesTab from "./modules/communication/CirculairesTab";

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
      <Toaster position="bottom-center" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardTemp />} />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "USER", "SUDO_ADMIN", "PROF"]}
                />
              }
            >
              <Route path="/eleves" element={<ElevesPage />} />
              <Route path="/eleves/:id" element={<EleveProfilPage />} />
              <Route path="/eleves/informations" element={<GestionElevesPage />} />
              <Route path="/eleves/ecolage" element={<GestionElevesPage />} />
              <Route path="/eleves/absences" element={<GestionElevesPage />} />
              <Route path="/eleves/parcours" element={<GestionElevesPage />} />
              <Route path="/eleves/vie-scolaire" element={<GestionElevesPage />} />
              <Route path="/eleves/documents" element={<GestionElevesPage />} />
              <Route
                path="/professeurs/:id"
                element={<ProfesseurProfilPage />}
              />
              <Route path="/parents/:id" element={<ParentProfilPage />} />
              <Route path="/professeurs" element={<ProfesseursPage />} />
              <Route path="/notes-examens" element={<NotesExamensPage />} />
              <Route path="/cahier-texte" element={<CahierTextePage />} />
            </Route>

            {/* Route mon profil : accessible uniquement aux PROFs */}
            <Route element={<ProtectedRoute allowedRoles={["PROF"]} />}>
              <Route path="/mon-profil" element={<MonProfilProfPage />} />
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
            <Route path="/classes/:id" element={<ClasseProfilPage />} />

            {/* Routes Logistique : ADMIN, SUDO_ADMIN, PROF */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["ADMIN", "SUDO_ADMIN", "PROF"]}
                />
              }
            >
              <Route path="/logistique/locaux" element={<LocauxTab />} />
              <Route path="/logistique/stocks" element={<StocksTab />} />
              <Route
                path="/logistique/inventaire"
                element={<InventaireTab />}
              />
              <Route
                path="/logistique/maintenance"
                element={<MaintenanceTab />}
              />
              <Route
                path="/logistique/transports"
                element={<TransportsTab />}
              />
              <Route path="/logistique/cantine" element={<CantineTab />} />
            </Route>

            {/* Routes Comptabilité : ADMIN, SUDO_ADMIN */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "SUDO_ADMIN"]} />
              }
            >
              <Route
                path="/comptabilite/frais-scolaires"
                element={<ComptabilitePage />}
              />
              <Route
                path="/comptabilite/bourses"
                element={<ComptabilitePage />}
              />
              <Route
                path="/comptabilite/generale"
                element={<ComptabilitePage />}
              />
              <Route
                path="/comptabilite/tresorerie"
                element={<ComptabilitePage />}
              />
              <Route
                path="/comptabilite/budget"
                element={<ComptabilitePage />}
              />
            </Route>

            {/* Routes RH : ADMIN, SUDO_ADMIN */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "SUDO_ADMIN"]} />
              }
            >
              <Route path="/rh/personnel" element={<PersonnelTab />} />
              <Route path="/rh/paie" element={<PaieTab />} />
              <Route path="/rh/conges" element={<CongesTab />} />
              <Route path="/rh/contrats" element={<ContratsTab />} />
              <Route path="/rh/formations" element={<FormationsTab />} />
              <Route path="/rh/evaluations" element={<EvaluationsTab />} />
            </Route>

            {/* Routes Communication : accessible à tous selon les sous-modules */}
            <Route
              path="/communication/messagerie"
              element={<MessagerieTab />}
            />
            <Route path="/communication/reunions" element={<ReunionsTab />} />
            <Route path="/communication/documents" element={<DocumentsTab />} />
            <Route
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "SUDO_ADMIN"]} />
              }
            >
              <Route
                path="/communication/notifications"
                element={<NotificationsTab />}
              />
              <Route path="/communication/sms" element={<SmsTab />} />
              <Route
                path="/communication/circulaires"
                element={<CirculairesTab />}
              />
            </Route>

            {/* Paramètres : ADMIN et SUDO_ADMIN uniquement */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "SUDO_ADMIN"]} />
              }
            >
              <Route path="/parametres" element={<ParametresPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
