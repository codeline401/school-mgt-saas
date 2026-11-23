# School Management SAAS

Un projet de type SaaS (Software as Service) multitenant pour la gestion d'établissement scolaires.
Ce projet utilise une structure MONOREPO et respècte des règles de gestion stricte
(ex : un elève appartient à une seule classe, un professeur intervient dans plusisieurs classes)

# Stack technique

- Infrasctructure :: Docker (PostgreSQL 15, redis, pgAdmin)
- Backend :: Node.js, Express, Typescript
- Frontend :: React (à venir)
- Structure :: Monorepo (npm workspace)

--

# Prérequis

Avant de commencer, assurez-vous d'avoir installer sur votre machine :

- [Node.js](https://nodejs.com/) (20.19 à 20.x, 22.12 à 22.x, ou 24 et versions ultérieures)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (doit être en cours d'éxecution)
- [Git](https://git-scm.com/)

---

# Installation et démarrage local

Suivez ces étapes dans l'ordre pour lancer l'environnement de développement sur votre machine.

### 1. Cloner le projet et installer les dépendances

```bash
git clone <url-repo>
cd school-mgt-saas
npm install
```

### Prisma : génération et migration

Depuis `apps/api`, Prisma charge d'abord `apps/api/.env`, puis complète les
variables manquantes depuis le `.env` à la racine. Les variables déjà définies
dans l'environnement restent prioritaires. Définissez `DATABASE_URL` avec une
URL PostgreSQL valide et assurez-vous que la base de développement est disponible.

```bash
cd apps/api
npx prisma --version
npx prisma generate
npx prisma migrate dev --name add-eleve-attachement
```

La migration modifie la base de développement ; vérifiez la base ciblée avant
de l'exécuter. Prisma 7 ne lance pas automatiquement `generate` après une migration.

## CI/CD GitHub Actions (develop/main -> VPS)

Le dépôt utilise 3 workflows :

- `CI` (`.github/workflows/ci.yml`) : lancé sur `push` et `pull_request` vers `develop` et `main` (`npm ci`, `npm run lint`, `npm run build`, `npm run test`).
- `Deploy Staging` (`.github/workflows/deploy-staging.yml`) : déploiement VPS de `develop` après succès du workflow `CI`.
- `Deploy Production` (`.github/workflows/deploy-production.yml`) : déploiement VPS de `main` après succès du workflow `CI`.

### Secrets GitHub requis

> Configurez ces secrets dans **Settings > Secrets and variables > Actions**.

**Staging (`develop`)**

- `STAGING_VPS_HOST`
- `STAGING_VPS_PORT` (ex: `22`)
- `STAGING_VPS_USER`
- `STAGING_VPS_SSH_KEY` (clé privée SSH)
- `STAGING_VPS_SSH_FINGERPRINT` (empreinte hôte SSH, recommandé)
- `STAGING_APP_PATH` (ex: `/var/www/school-mgt-saas-staging`)
- `STAGING_RESTART_COMMAND` (ex: `docker compose up -d --build` ou `sudo systemctl restart school-saas-staging`)

**Production (`main`)**

- `PROD_VPS_HOST`
- `PROD_VPS_PORT` (ex: `22`)
- `PROD_VPS_USER`
- `PROD_VPS_SSH_KEY` (clé privée SSH)
- `PROD_VPS_SSH_FINGERPRINT` (empreinte hôte SSH, recommandé)
- `PROD_APP_PATH` (ex: `/var/www/school-mgt-saas-production`)
- `PROD_RESTART_COMMAND` (ex: `docker compose up -d --build` ou `sudo systemctl restart school-saas`)
