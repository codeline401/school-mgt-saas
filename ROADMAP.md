# 🗺️ Roadmap — School Management SaaS

> Version cible : **v1.0.0** — MVP multi-tenant fonctionnel

---

## 🏗️ Stack technique

| Couche       | Technologie                                               |
| ------------ | --------------------------------------------------------- |
| **Backend**  | Express.js 5, TypeScript, Prisma 7, PostgreSQL 15         |
| **Frontend** | React 19, Vite, Tailwind CSS 4, DaisyUI 5                 |
| **State**    | Zustand (persist) + React Query                           |
| **Auth**     | JWT (8h) + bcrypt                                         |
| **Infra**    | Docker Compose (PostgreSQL, Redis, pgAdmin)               |
| **Monorepo** | npm workspaces (`apps/api`, `apps/web`, `packages/types`) |

---

## ✅ Ce qui est fait

### Backend

- [x] Projet Express + TypeScript bootstrappé
- [x] Connexion PostgreSQL via Prisma avec migrations
- [x] Schéma de base : `User`, `School`, `Classe`, `Eleve`, `Professeur`
- [x] Enum des rôles : `SUDO_ADMIN`, `ADMIN`, `USER`, `PROF`, `ELEVE`, `PARENT`
- [x] Système d'`inviteCode` par école pour l'onboarding des membres
- [x] **Auth — POST `/api/auth/login`** : JWT retourné, logique de rôle
- [x] **Auth — POST `/api/auth/register`** : création de compte avec logique d'inviteCode
- [x] Middleware `authenticate` (vérification Bearer token)
- [x] Middleware `authorizeRoles(...roles)` (RBAC)
- [x] **Elèves — GET `/api/eleves`** : liste avec détails de classe
- [x] **Elèves — POST `/api/eleves`** : création d'un élève (validé par Zod)
- [x] Seed de données de test (`prisma/seed.ts`)
- [x] Docker Compose : PostgreSQL + Redis + pgAdmin

### Frontend

- [x] Projet Vite + React + TypeScript bootstrappé
- [x] Tailwind CSS v4 + DaisyUI configurés (plugin Vite)
- [x] Axios client configuré (auto-Bearer, interceptor 401 → logout)
- [x] Store Zustand (`authStore`) persisté dans `localStorage`
- [x] React Query configuré pour le fetching des données
- [x] React Router DOM configuré avec routes protégées
- [x] **Page Login** — formulaire complet, gestion d'erreur, loading
- [x] **Page Register** — formulaire complet avec champ conditionnel `inviteCode`
- [x] **Dashboard (temp)** — écran de bienvenue authentifié
- [x] **Page Élèves** — tableau listant les élèves avec leur classe
- [x] **Composant `ProtectedRoute`** — garde de route avec vérification des rôles
- [x] **Composant `Sidebar`** — navigation latérale (liens partiels)
- [x] **Layout `DashboardLayout`** — structure principale de l'app
- [x] Hook `useAuth` — mutations login/register avec React Query

### Packages partagés

- [x] Package `@school-mgt/types` — types partagés entre `api` et `web`

---

## 🚧 Ce qui reste à faire pour la v1.0.0

### 🔴 Priorité haute — Fonctionnalités core

#### Backend

- [ ] **GET `/api/schools`** — liste des écoles (SUDO_ADMIN uniquement)
- [ ] **POST `/api/schools`** — créer une école
- [ ] **GET/POST `/api/classes`** — CRUD des classes d'une école
- [ ] **GET/POST/PUT/DELETE `/api/professeurs`** — CRUD professeurs
- [ ] **PUT/DELETE `/api/eleves/:id`** — modifier / supprimer un élève
- [ ] **GET `/api/users/me`** — profil de l'utilisateur connecté
- [ ] **Route onboarding** — rejoindre une école via `inviteCode`
- [ ] Validation Zod sur toutes les routes manquantes

#### Frontend

- [ ] **Page Professeurs** — liste + formulaire de création
- [ ] **Page Classes** — liste + formulaire de création
- [ ] **Modal "Ajouter un élève"** sur la page Élèves (bouton déjà présent)
- [ ] **Page Profil utilisateur** — afficher et modifier son profil
- [ ] **Page Onboarding** — rejoindre une école avec un code d'invitation
- [ ] **Page Création d'école** — formulaire pour les ADMIN
- [ ] Wiring des liens manquants dans la `Sidebar` (Professeurs, Paramètres)

---

### 🟡 Priorité moyenne — UX & robustesse

#### Backend

- [ ] Pagination sur les routes de liste (elèves, professeurs, classes)
- [ ] Gestion centralisée des erreurs (middleware `errorHandler`)
- [ ] Logging des requêtes (morgan ou equivalent)
- [ ] Variables d'environnement documentées (`.env.example`)
- [ ] Tests d'intégration sur les routes auth (Jest / Vitest)

#### Frontend

- [ ] Gestion des états vides (empty states) sur tous les tableaux
- [ ] Pagination ou scroll infini sur les listes
- [ ] Formulaires de modification (edit) pour élèves, profs, classes
- [ ] Confirmation avant suppression (modal de confirmation)
- [ ] Thème clair/sombre (DaisyUI supporte les thèmes nativement)
- [ ] Tests unitaires sur les composants critiques (Vitest + Testing Library)

---

### 🟢 Priorité basse — Pour la v1.0.0 complète

- [ ] **Redis** — utiliser le cache pour les sessions ou les tokens invalidés
- [ ] **Refresh token** — mécanisme de renouvellement silencieux du JWT
- [ ] **Envoi d'email** — invitation par email avec le code d'accès
- [ ] **Upload d'avatar** — photo de profil utilisateur/école
- [ ] **Tableau de bord statistiques** — nombre d'élèves, classes, profs par école
- [ ] **Multi-langue (i18n)** — français/anglais
- [ ] CI/CD GitHub Actions — lint, tests, build automatiques

---

## 📐 Architecture multi-tenant

```text
SUDO_ADMIN
  └─ Accès à toutes les écoles

ADMIN (par école)
  ├─ Crée l'école
  ├─ Génère l'inviteCode
  └─ Gère les utilisateurs de son école

PROF / ELEVE / PARENT / USER
  └─ Rejoignent l'école via inviteCode
```

---

## 🔢 Définition de la v1.0.0

La v1.0.0 sera considérée **done** quand :

1. Un ADMIN peut créer une école et inviter des membres
2. Les CRUD complets fonctionnent pour Élèves, Professeurs et Classes
3. Chaque rôle voit uniquement ce qui le concerne
4. L'application tourne en production (Docker) avec variables d'environnement sécurisées
5. Les routes critiques ont des tests de base
