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

- [Node.js](https://nodejs.com/) (version 18 ou supérieur)
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
