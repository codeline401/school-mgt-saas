# Module Locaux - Architecture Frontend

## 📂 Structure des fichiers

```
apps/web/src/modules/logistique/
├── LocauxTab.tsx                          # Composant principal avec navigation
├── hooks/
│   └── useLocaux.ts                       # Hooks React Query centralisés
└── components/
    ├── BatimentModal.tsx                  # Modal création/édition bâtiment
    ├── SalleModal.tsx                     # Modal création/édition salle
    ├── InventaireBatimentsTab.tsx         # Vue inventaire avec filtres
    └── StatistiquesTab.tsx                # Vue statistiques et graphiques
```

## 🎯 Composants

### LocauxTab.tsx (Composant principal)

- Navigation entre 3 sous-onglets : Inventaire, Statistiques, Réservations
- Architecture propre avec composants modulaires
- Gestion de l'état actif du sous-onglet

### hooks/useLocaux.ts

Centralise toute la logique API avec React Query :

**Bâtiments:**

- `useBatiments()` - Liste des bâtiments
- `useBatiment(id)` - Détails d'un bâtiment
- `useCreateBatiment()` - Création
- `useUpdateBatiment()` - Modification
- `useDeleteBatiment()` - Suppression

**Salles:**

- `useSalles(filters?)` - Liste avec filtres optionnels
- `useSalle(id)` - Détails d'une salle
- `useCreateSalle()` - Création
- `useUpdateSalle()` - Modification
- `useDeleteSalle()` - Suppression

**Statistiques:**

- `useStatistiques()` - Statistiques globales

**Fonctionnalités:**

- Invalidation automatique du cache
- Toast notifications
- Gestion des erreurs
- Types TypeScript complets

### InventaireBatimentsTab.tsx

**Fonctionnalités:**

- Liste hiérarchique : Bâtiments → Salles
- Recherche globale (bâtiments et salles)
- Expansion/collapse des bâtiments
- CRUD complet avec modals
- Badges de statut colorés
- Gestion des permissions (lecture/écriture)
- Design responsive

**Informations affichées:**

- Bâtiment : nom, code, nombre d'étages, nombre de salles
- Salle : nom, code, type, étage, capacité, PMR, statut

### BatimentModal.tsx

**Champs:**

- Nom (obligatoire, 2-100 caractères)
- Code (optionnel, max 20 caractères)
- Description (optionnelle, max 500 caractères)
- Nombre d'étages (1-100, défaut: 1)

**Fonctionnalités:**

- Mode création/édition
- Validation des champs
- États de chargement
- Gestion des erreurs

### SalleModal.tsx

**Champs:**

- Nom (obligatoire)
- Code (optionnel)
- Type (COURS, LABO_SCIENCE, INFORMATIQUE, AMPHI, etc.)
- Bâtiment (sélection obligatoire)
- Étage (validation avec nbEtages du bâtiment)
- Capacité (1-1000)
- Statut (DISPONIBLE, MAINTENANCE, RESERVEE)
- PMR Accessible (checkbox, défaut: true)

**Fonctionnalités:**

- Mode création/édition
- Dropdown des bâtiments disponibles
- Validation étage vs bâtiment
- États de chargement

### StatistiquesTab.tsx

**Affichages:**

- 3 cartes principales : Nombre de bâtiments, Nombre de salles, Capacité totale
- Graphiques à barres : Répartition par type
- Graphiques à barres : Répartition par statut
- Résumé textuel global

**Design:**

- Cards DaisyUI avec stats
- Progress bars avec pourcentages
- Icônes Lucide React
- Couleurs selon le type/statut

## 🔄 Flux de données

```
Composant UI
    ↓ useLocaux hook
    ↓ React Query
    ↓ API request (/api/logistique/locaux/...)
    ↓ Backend service
    ↓ Prisma ORM
    ↓ PostgreSQL
```

## 🎨 Design System

**Technologies:**

- React 18+
- TypeScript
- TanStack Query v5
- DaisyUI + Tailwind CSS
- Lucide React (icônes)
- React Hot Toast (notifications)

**Patterns:**

- Custom hooks pour la logique API
- Modal components réutilisables
- Composants de présentation purs
- Gestion d'état locale avec useState
- Cache optimiste avec React Query

## ✅ Fonctionnalités implémentées

- [x] CRUD complet bâtiments
- [x] CRUD complet salles
- [x] Recherche et filtrage
- [x] Statistiques visuelles
- [x] Gestion des permissions
- [x] Validation des données
- [x] Toast notifications
- [x] États de chargement
- [x] Gestion des erreurs
- [x] Design responsive
- [x] Architecture modulaire

## 🚧 À venir

- [ ] Système de réservations
- [ ] Calendrier de disponibilité
- [ ] Gestion des équipements détaillée
- [ ] Export PDF/Excel
- [ ] Historique des modifications
- [ ] Photos des locaux

## 🛠️ Développement

### Ajouter un nouveau champ

1. **Backend** : Mettre à jour le schéma Prisma
2. **Backend** : Mettre à jour les schemas Zod dans `locaux.schema.ts`
3. **Backend** : Mettre à jour le service si nécessaire
4. **Frontend** : Mettre à jour les types dans `useLocaux.ts`
5. **Frontend** : Mettre à jour les modals et composants

### Ajouter un nouveau filtre

1. **Frontend** : Ajouter l'état local dans `InventaireBatimentsTab.tsx`
2. **Frontend** : Passer le filtre à `useSalles(filters)`
3. **Backend** : Gérer le nouveau paramètre dans le service

## 📝 Notes techniques

- Tous les mutations invalident automatiquement les queries concernées
- Les modals se ferment automatiquement après succès
- Les toasts s'affichent pour chaque action (succès/erreur)
- La recherche filtre à la fois les bâtiments et les salles
- Les étages sont numérotés de 0 (RDC) à n-1
- Les permissions sont vérifiées côté client ET serveur
