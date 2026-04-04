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
