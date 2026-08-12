import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import toast from "react-hot-toast";

const API_URL = "/api/logistique/transport";

// ==========================================
// TYPES
// ==========================================

export type TypeVehicule = "BUS" | "MINIBUS" | "VOITURE" | "VAN";
export type StatutVehicule = "ACTIF" | "MAINTENANCE" | "HORS_SERVICE" | "VENDU";
export type StatutChauffeur = "ACTIF" | "CONGE" | "SUSPENDU" | "INACTIF";
export type TypeRoute = "ALLER" | "RETOUR" | "ALLER_RETOUR" | "SORTIE";
export type StatutRoute = "ACTIVE" | "SUSPENDUE" | "ANNULEE";
export type StatutAffectation = "ACTIVE" | "SUSPENDUE" | "TERMINEE";

export interface Vehicule {
  id: string;
  nom: string;
  immatriculation: string;
  typeVehicule: TypeVehicule;
  capacite: number;
  marque?: string;
  modele?: string;
  annee?: number;
  statut: StatutVehicule;
  derniereRevision?: string;
  prochaineRevision?: string;
  kilometrage?: number;
  numeroAssurance?: string;
  dateExpirationAssurance?: string;
  routes?: Route[];
  _count?: {
    routes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Chauffeur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  numeroPermis: string;
  typePermis: string;
  dateExpirationPermis?: string;
  statut: StatutChauffeur;
  adresse?: string;
  dateNaissance?: string;
  dateEmbauche?: string;
  routes?: Route[];
  _count?: {
    routes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  nom: string;
  typeRoute: TypeRoute;
  statut: StatutRoute;
  heureDepart: string;
  heureArrivee?: string;
  vehiculeId: string;
  vehicule: {
    id: string;
    nom: string;
    immatriculation: string;
    capacite: number;
  };
  chauffeurId: string;
  chauffeur: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
  };
  joursActifs: string;
  arrets?: string;
  affectations?: AffectationTransport[];
  _count?: {
    affectations: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AffectationTransport {
  id: string;
  eleveId: string;
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    classe?: {
      nom: string;
    };
  };
  routeId: string;
  route: {
    id: string;
    nom: string;
    typeRoute: TypeRoute;
    heureDepart: string;
    vehicule: {
      nom: string;
      immatriculation: string;
    };
    chauffeur: {
      nom: string;
      prenom: string;
    };
  };
  arretMontee?: string;
  arretDescente?: string;
  statut: StatutAffectation;
  dateDebut: string;
  dateFin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehiculeInput {
  nom: string;
  immatriculation: string;
  typeVehicule: TypeVehicule;
  capacite: number;
  marque?: string;
  modele?: string;
  annee?: number;
  derniereRevision?: string;
  prochaineRevision?: string;
  kilometrage?: number;
  numeroAssurance?: string;
  dateExpirationAssurance?: string;
}

export interface UpdateVehiculeInput {
  nom?: string;
  immatriculation?: string;
  typeVehicule?: TypeVehicule;
  capacite?: number;
  marque?: string;
  modele?: string;
  annee?: number;
  statut?: StatutVehicule;
  derniereRevision?: string;
  prochaineRevision?: string;
  kilometrage?: number;
  numeroAssurance?: string;
  dateExpirationAssurance?: string;
}

export interface CreateChauffeurInput {
  nom: string;
  prenom: string;
  telephone: string;
  numeroPermis: string;
  typePermis: string;
  dateExpirationPermis?: string;
  adresse?: string;
  dateNaissance?: string;
  dateEmbauche?: string;
}

export interface UpdateChauffeurInput {
  nom?: string;
  prenom?: string;
  telephone?: string;
  numeroPermis?: string;
  typePermis?: string;
  dateExpirationPermis?: string;
  statut?: StatutChauffeur;
  adresse?: string;
  dateNaissance?: string;
  dateEmbauche?: string;
}

export interface CreateRouteInput {
  nom: string;
  typeRoute: TypeRoute;
  heureDepart: string;
  heureArrivee?: string;
  vehiculeId: string;
  chauffeurId: string;
  joursActifs: string;
  arrets?: string;
}

export interface UpdateRouteInput {
  nom?: string;
  typeRoute?: TypeRoute;
  statut?: StatutRoute;
  heureDepart?: string;
  heureArrivee?: string;
  vehiculeId?: string;
  chauffeurId?: string;
  joursActifs?: string;
  arrets?: string;
}

export interface CreateAffectationInput {
  eleveId: string;
  routeId: string;
  arretMontee?: string;
  arretDescente?: string;
  dateDebut?: string;
  dateFin?: string;
}

export interface UpdateAffectationInput {
  routeId?: string;
  arretMontee?: string;
  arretDescente?: string;
  statut?: StatutAffectation;
  dateDebut?: string;
  dateFin?: string;
}

// ==========================================
// HOOKS VEHICULES
// ==========================================

export const useVehicules = (filters?: {
  statut?: StatutVehicule;
  typeVehicule?: TypeVehicule;
}) => {
  return useQuery({
    queryKey: ["vehicules", filters],
    queryFn: async () => {
      const { data } = await api.get<Vehicule[]>(`${API_URL}/vehicules`, {
        params: filters,
      });
      return data;
    },
  });
};

export const useVehicule = (vehiculeId?: string) => {
  return useQuery({
    queryKey: ["vehicule", vehiculeId],
    queryFn: async () => {
      if (!vehiculeId) return null;
      const { data } = await api.get<Vehicule>(
        `${API_URL}/vehicules/${vehiculeId}`,
      );
      return data;
    },
    enabled: !!vehiculeId,
  });
};

export const useCreateVehicule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateVehiculeInput) => {
      const { data } = await api.post<Vehicule>(`${API_URL}/vehicules`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicules"] });
      toast.success("Véhicule créé avec succès");
    },
    onError: (error) => {
      const message =
        error?.message || "Erreur lors de la création du véhicule";
      toast.error(message);
    },
  });
};

export const useUpdateVehicule = (vehiculeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateVehiculeInput) => {
      const { data } = await api.patch<Vehicule>(
        `${API_URL}/vehicules/${vehiculeId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicules"] });
      queryClient.invalidateQueries({ queryKey: ["vehicule", vehiculeId] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast.success("Véhicule mis à jour avec succès.");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du véhicule.");
    },
  });
};

export const useDeleteVehicule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehiculeId: string) => {
      const { data } = await api.delete(`${API_URL}/vehicules/${vehiculeId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicules"] });
      toast.success("Véhicule supprimé avec succès.");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du véhicule.");
    },
  });
};

// ==========================================
// HOOKS CHAUFFEURS
// ==========================================

export const useChauffeurs = (filters?: { statut?: StatutChauffeur }) => {
  return useQuery({
    queryKey: ["chauffeurs", filters],
    queryFn: async () => {
      const { data } = await api.get<Chauffeur[]>(`${API_URL}/chauffeurs`, {
        params: filters,
      });
      return data;
    },
  });
};

export const useChauffeur = (chauffeurId?: string) => {
  return useQuery({
    queryKey: ["chauffeur", chauffeurId],
    queryFn: async () => {
      if (!chauffeurId) return null;
      const { data } = await api.get<Chauffeur>(
        `${API_URL}/chauffeurs/${chauffeurId}`,
      );
      return data;
    },
    enabled: !!chauffeurId,
  });
};

export const useCreateChauffeur = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateChauffeurInput) => {
      const { data } = await api.post<Chauffeur>(
        `${API_URL}/chauffeurs`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chauffeurs"] });
      toast.success("Chauffeur créé avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la création du chauffeur.");
    },
  });
};

export const useUpdateChauffeur = (chauffeurId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateChauffeurInput) => {
      const { data } = await api.patch<Chauffeur>(
        `${API_URL}/chauffeurs/${chauffeurId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chauffeurs"] });
      queryClient.invalidateQueries({ queryKey: ["chauffeur", chauffeurId] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast.success("Chauffeur mis à jour avec succès.");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du chauffeur.");
    },
  });
};

export const useDeleteChauffeur = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chauffeurId: string) => {
      const { data } = await api.delete(`${API_URL}/chauffeurs/${chauffeurId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chauffeurs"] });
      toast.success("Chauffeur supprimé avec succès.");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du chauffeur.");
    },
  });
};

// ==========================================
// HOOKS ROUTES
// ==========================================

export const useRoutes = (filters?: {
  statut?: StatutRoute;
  typeRoute?: TypeRoute;
  vehiculeId?: string;
  chauffeurId?: string;
}) => {
  return useQuery({
    queryKey: ["routes", filters],
    queryFn: async () => {
      const { data } = await api.get<Route[]>(`${API_URL}/routes`, {
        params: filters,
      });
      return data;
    },
  });
};

export const useRoute = (routeId?: string) => {
  return useQuery({
    queryKey: ["route", routeId],
    queryFn: async () => {
      if (!routeId) return null;
      const { data } = await api.get<Route>(`${API_URL}/routes/${routeId}`);
      return data;
    },
    enabled: !!routeId,
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRouteInput) => {
      const { data } = await api.post<Route>(`${API_URL}/routes`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
};

export const useUpdateRoute = (routeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRouteInput) => {
      const { data } = await api.patch<Route>(
        `${API_URL}/routes/${routeId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["route", routeId] });
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string) => {
      const { data } = await api.delete(`${API_URL}/routes/${routeId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast.success("Route supprimée avec succès.");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la route.");
    },
  });
};

// ==========================================
// HOOKS AFFECTATIONS
// ==========================================

export const useAffectations = (filters?: {
  eleveId?: string;
  routeId?: string;
  statut?: StatutAffectation;
}) => {
  return useQuery({
    queryKey: ["affectations", filters],
    queryFn: async () => {
      const { data } = await api.get<AffectationTransport[]>(
        `${API_URL}/affectations`,
        {
          params: filters,
        },
      );
      return data;
    },
  });
};

export const useCreateAffectation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAffectationInput) => {
      const { data } = await api.post<AffectationTransport>(
        `${API_URL}/affectations`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast.success("Affectation créée avec succès.");
    },
    onError: () => {
      toast.error("Erreur lors de la création de l'affectation.");
    },
  });
};

export const useUpdateAffectation = (affectationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAffectationInput) => {
      const { data } = await api.patch<AffectationTransport>(
        `${API_URL}/affectations/${affectationId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
};

export const useDeleteAffectation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (affectationId: string) => {
      const { data } = await api.delete(
        `${API_URL}/affectations/${affectationId}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affectations"] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
};
