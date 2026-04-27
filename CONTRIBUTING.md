# 🤝 Guide de contribution — School Management SaaS

Merci de contribuer à ce projet ! Ce guide explique tout ce qu'il faut savoir pour travailler efficacement sur le code.

---

## 📋 Table des matières

1. [Prérequis](#-prérequis)
2. [Installation](#-installation)
3. [Structure du projet](#-structure-du-projet)
4. [Conventions de code](#-conventions-de-code)
5. [Travailler sur le backend](#-travailler-sur-le-backend)
6. [Travailler sur le frontend](#-travailler-sur-le-frontend)
7. [Base de données & Prisma](#-base-de-données--prisma)
8. [Workflow Git](#-workflow-git)
9. [Variables d'environnement](#-variables-denvironnement)

---

## 🧰 Prérequis

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Node.js | 20.x LTS | `node -v` |
| npm | 10.x | `npm -v` |
| Docker Desktop | Dernière version | `docker -v` |
| Git | Dernière version | `git -v` |

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone <URL_DU_REPO>
cd school-mgt-saas
```

### 2. Installer toutes les dépendances (racine + workspaces)

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Remplir les valeurs dans apps/api/.env
```

### 4. Lancer la base de données

```bash
docker compose up -d
```

Cela démarre :
- **PostgreSQL** sur le port `5432`
- **Redis** sur le port `6379`
- **pgAdmin** sur `http://localhost:8080`

### 5. Appliquer les migrations et seeder la BDD

```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

### 6. Lancer les serveurs de développement

Dans deux terminaux séparés :

```bash
# Terminal 1 — API
cd apps/api
npm run dev

# Terminal 2 — Frontend
cd apps/web
npm run dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:5000 |
| Frontend | http://localhost:5173 |
| pgAdmin | http://localhost:8080 |

---

## 📁 Structure du projet

```
school-mgt-saas/
├── apps/
│   ├── api/                   # Backend Express + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # Schéma de la base de données
│   │   │   ├── seed.ts        # Données de test
│   │   │   └── migrations/    # Migrations SQL générées automatiquement
│   │   └── src/
│   │       ├── index.ts       # Point d'entrée, configuration Express
│   │       ├── controllers/   # Logique métier des routes
│   │       ├── routes/        # Définition des routes Express
│   │       ├── schemas/       # Schémas de validation Zod
│   │       ├── middlewares/   # Authentification, autorisation, erreurs
│   │       └── lib/
│   │           └── prisma.ts  # Instance Prisma client
│   └── web/                   # Frontend React + Vite
│       └── src/
│           ├── pages/         # Composants de page (une route = une page)
│           ├── components/    # Composants réutilisables
│           ├── layouts/       # Structures de mise en page
│           ├── hooks/         # Hooks React personnalisés
│           ├── store/         # Stores Zustand (état global)
│           ├── lib/
│           │   └── api.ts     # Instance Axios configurée
│           └── main.tsx       # Point d'entrée React
└── packages/
    └── types/
        └── index.ts           # Types TypeScript partagés API ↔ Web
```

---

## ✏️ Conventions de code

### Général

- **Langue du code** : anglais (noms de variables, fonctions, commentaires)
- **Langue des messages UI** : français
- **TypeScript strict** : pas de `any` sauf cas exceptionnel justifié
- **Formatage** : Prettier (configuration à la racine) — exécuter avant chaque commit

### Nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Composants React | PascalCase | `StudentTable.tsx` |
| Hooks | camelCase + préfixe `use` | `useStudents.ts` |
| Stores Zustand | camelCase + suffixe `Store` | `authStore.ts` |
| Fichiers de routes | camelCase + suffixe `Routes` | `elevesRoutes.ts` |
| Fichiers de controllers | camelCase + suffixe `Controller` | `elevesController.ts` |
| Schémas Zod | camelCase + suffixe `Schema` | `createEleveSchema` |
| Variables, fonctions | camelCase | `getStudentById` |
| Constantes | UPPER_SNAKE_CASE | `JWT_SECRET` |

### Imports

Ordre des imports dans chaque fichier :
1. Modules Node.js natifs
2. Packages tiers (`express`, `react`, `zod`…)
3. Packages internes (`@school-mgt/types`)
4. Modules locaux (chemins relatifs `./`, `../`)

---

## 🔧 Travailler sur le backend

### Ajouter une nouvelle route

1. **Créer le schéma Zod** dans `apps/api/src/schemas/`
2. **Créer le controller** dans `apps/api/src/controllers/`
3. **Créer le fichier de routes** dans `apps/api/src/routes/`
4. **Enregistrer la route** dans `apps/api/src/index.ts`

#### Exemple minimal d'une route protégée

```typescript
// routes/classesRoutes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { getClasses, createClasse } from "../controllers/classesController";

const router = Router();

router.get("/", authenticate, getClasses);
router.post("/", authenticate, authorizeRoles("ADMIN", "SUDO_ADMIN"), createClasse);

export default router;
```

### Règles de sécurité API

- **Toutes les routes** (sauf `/api/auth/login` et `/api/auth/register`) doivent avoir le middleware `authenticate`
- Les routes d'écriture (POST, PUT, DELETE) doivent avoir `authorizeRoles`
- Valider **toutes les entrées** avec un schéma Zod
- Ne jamais retourner le champ `password` dans les réponses
- Utiliser des codes HTTP appropriés : `200`, `201`, `400`, `401`, `403`, `404`, `500`

### Codes HTTP de référence

| Code | Usage |
|------|-------|
| `200` | Succès (GET, PUT) |
| `201` | Ressource créée (POST) |
| `400` | Données invalides |
| `401` | Non authentifié |
| `403` | Non autorisé (rôle insuffisant) |
| `404` | Ressource introuvable |
| `500` | Erreur serveur |

---

## 🎨 Travailler sur le frontend

### Ajouter une nouvelle page

1. Créer le fichier dans `apps/web/src/pages/`
2. Ajouter la route dans `apps/web/src/App.tsx`
3. Si la page est protégée, envelopper avec `<ProtectedRoute roles={[...]} />`
4. Ajouter le lien dans `apps/web/src/components/Sidebar.tsx`

### Fetching de données

Toujours utiliser **React Query** pour les appels API, jamais `useEffect` + `fetch` directement.

```typescript
// hooks/useClasses.ts
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { Classe } from "@school-mgt/types";

export function useClasses() {
  return useQuery<Classe[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await api.get("/api/classes");
      return data;
    },
  });
}
```

### Clés de query React Query

| Entité | queryKey |
|--------|----------|
| Élèves | `["eleves"]` |
| Professeurs | `["professeurs"]` |
| Classes | `["classes"]` |
| Écoles | `["schools"]` |
| Profil | `["me"]` |

### État global (Zustand)

Utiliser Zustand **uniquement** pour l'état global qui survit à la navigation :
- Authentification (`authStore`)
- Préférences utilisateur (thème, etc.)

**Ne pas** mettre dans Zustand : données serveur (c'est le rôle de React Query), état de formulaire local.

---

## 🗄️ Base de données & Prisma

### Modifier le schéma

1. Modifier `apps/api/prisma/schema.prisma`
2. Créer la migration :
   ```bash
   cd apps/api
   npx prisma migrate dev --name description_de_la_modification
   ```
3. Régénérer le client Prisma (automatique avec `migrate dev`)
4. Mettre à jour le seed si nécessaire

### Conventions Prisma

- Les noms de modèles sont en **PascalCase** singulier : `Eleve`, `Classe`
- Les champs de clé étrangère portent le nom du modèle + `Id` : `schoolId`, `classeId`
- Ajouter `createdAt DateTime @default(now())` et `updatedAt DateTime @updatedAt` sur les modèles principaux
- Ne jamais modifier une migration déjà appliquée en production — toujours créer une nouvelle migration

### Visualiser la BDD

```bash
cd apps/api
npx prisma studio
```

Ou utiliser pgAdmin : http://localhost:8080
- Email : `admin@ecole.com`
- Mot de passe : `admin_codeline401`

---

## 🌿 Workflow Git

### Nommage des branches

```
feat/nom-de-la-fonctionnalite
fix/description-du-bug
chore/tache-technique
docs/mise-a-jour-doc
```

Exemples :
- `feat/professeurs-crud`
- `fix/login-redirect-error`
- `chore/update-prisma`

### Convention des commits (Conventional Commits)

```
type(scope): description courte en français

Corps optionnel expliquant le pourquoi.
```

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `chore` | Tâche technique (deps, config) |
| `docs` | Documentation uniquement |
| `refactor` | Refactoring sans changement de comportement |
| `test` | Ajout ou modification de tests |
| `style` | Formatage, espaces, point-virgules |

Exemples :
```
feat(api): ajouter le CRUD professeurs
fix(web): corriger la redirection après logout
chore(deps): mettre à jour Prisma vers 7.7.0
```

### Process de contribution

```
main (production)
  └── develop (intégration)
        ├── feat/professeurs-crud
        ├── fix/eleve-delete
        └── chore/add-pagination
```

1. Créer une branche depuis `develop`
2. Développer la fonctionnalité
3. Ouvrir une Pull Request vers `develop`
4. Review obligatoire avant merge
5. `develop` → `main` uniquement pour les releases

---

## 🔑 Variables d'environnement

### `apps/api/.env`

```env
# Base de données
DATABASE_URL="postgresql://admin_user:dev_codeline401@localhost:5432/school_saas_db?schema=public"

# JWT
JWT_SECRET="changez-cette-valeur-en-production"
JWT_EXPIRES_IN="8h"

# Serveur
PORT=5000
NODE_ENV=development
```

### `apps/web/.env` (optionnel)

```env
VITE_API_URL=http://localhost:5000
```

> ⚠️ **Ne jamais committer de fichiers `.env`**. Ils sont dans `.gitignore`.
> Seul le fichier `.env.example` (sans valeurs sensibles) doit être versionné.

---

## ❓ Aide

- **Prisma** : https://www.prisma.io/docs
- **Tailwind CSS v4** : https://tailwindcss.com/docs
- **DaisyUI** : https://daisyui.com/components
- **React Query** : https://tanstack.com/query/latest
- **Zustand** : https://zustand.docs.pmnd.rs
