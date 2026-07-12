# Module de Gestion des Locaux

Ce module gère l'inventaire des locaux scolaires (bâtiments et salles) pour la plateforme SaaS de gestion scolaire.

## 📋 Fonctionnalités

### Gestion des Bâtiments
- ✅ Création de bâtiments
- ✅ Modification de bâtiments
- ✅ Suppression de bâtiments (cascade sur les salles)
- ✅ Consultation de la liste des bâtiments avec leurs salles
- ✅ Consultation d'un bâtiment spécifique

### Gestion des Salles
- ✅ Création de salles
- ✅ Modification de salles
- ✅ Suppression de salles
- ✅ Consultation de la liste des salles (avec filtres)
- ✅ Consultation d'une salle spécifique
- ✅ Validation de l'étage par rapport au nombre d'étages du bâtiment

### Statistiques
- ✅ Nombre de bâtiments et salles
- ✅ Capacité totale d'accueil
- ✅ Répartition par type de salle
- ✅ Répartition par statut

## 🔌 Endpoints API

Tous les endpoints nécessitent une authentification JWT.

### Bâtiments

#### Liste des bâtiments
```http
GET /api/logistique/locaux/batiments
Authorization: Bearer <token>
```

**Permissions requises:** ADMIN, SUDO_ADMIN, PROF

**Réponse:**
```json
[
  {
    "id": "uuid",
    "nom": "Bâtiment A",
    "code": "BAT-A",
    "description": "Bâtiment principal",
    "nbEtages": 3,
    "schoolId": "uuid",
    "salles": [...]
  }
]
```

#### Créer un bâtiment
```http
POST /api/logistique/locaux/batiments
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Bâtiment A",
  "code": "BAT-A",
  "description": "Bâtiment principal",
  "nbEtages": 3
}
```

**Permissions requises:** ADMIN, SUDO_ADMIN

#### Mettre à jour un bâtiment
```http
PUT /api/logistique/locaux/batiments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Bâtiment A - Rénové"
}
```

**Permissions requises:** ADMIN, SUDO_ADMIN

#### Supprimer un bâtiment
```http
DELETE /api/logistique/locaux/batiments/:id
Authorization: Bearer <token>
```

**Permissions requises:** ADMIN, SUDO_ADMIN

⚠️ **Attention:** La suppression d'un bâtiment supprime également toutes ses salles.

### Salles

#### Liste des salles
```http
GET /api/logistique/locaux/salles?batimentId=uuid&type=COURS&statut=DISPONIBLE
Authorization: Bearer <token>
```

**Permissions requises:** ADMIN, SUDO_ADMIN, PROF

**Paramètres de filtrage (optionnels):**
- `batimentId`: UUID du bâtiment
- `type`: Type de salle (COURS, LABO_SCIENCE, INFORMATIQUE, AMPHI, REUNION, SPORT, ADMINISTRATIF, AUTRE)
- `statut`: Statut de la salle (DISPONIBLE, MAINTENANCE, RESERVEE)

#### Créer une salle
```http
POST /api/logistique/locaux/salles
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Salle 204",
  "code": "S-204",
  "type": "COURS",
  "etage": 2,
  "capacite": 35,
  "pmrAccessible": true,
  "equipements": {
    "videoprojecteur": true,
    "tableau_numerique": true,
    "ordinateurs": 0
  },
  "statut": "DISPONIBLE",
  "batimentId": "uuid"
}
```

**Permissions requises:** ADMIN, SUDO_ADMIN

**Validations:**
- L'étage doit être compris entre 0 et le nombre d'étages du bâtiment - 1
- Le bâtiment doit appartenir à l'école de l'utilisateur

#### Mettre à jour une salle
```http
PUT /api/logistique/locaux/salles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "statut": "MAINTENANCE"
}
```

**Permissions requises:** ADMIN, SUDO_ADMIN

#### Supprimer une salle
```http
DELETE /api/logistique/locaux/salles/:id
Authorization: Bearer <token>
```

**Permissions requises:** ADMIN, SUDO_ADMIN

### Statistiques

#### Obtenir les statistiques des locaux
```http
GET /api/logistique/locaux/statistiques
Authorization: Bearer <token>
```

**Permissions requises:** ADMIN, SUDO_ADMIN

**Réponse:**
```json
{
  "nombreBatiments": 3,
  "nombreSalles": 25,
  "capaciteTotale": 875,
  "sallesParType": [
    { "type": "COURS", "nombre": 15 },
    { "type": "LABO_SCIENCE", "nombre": 3 },
    { "type": "INFORMATIQUE", "nombre": 2 }
  ],
  "sallesParStatut": [
    { "statut": "DISPONIBLE", "nombre": 22 },
    { "statut": "MAINTENANCE", "nombre": 3 }
  ]
}
```

## 📝 Types de Salles

- `COURS`: Salle de cours standard
- `LABO_SCIENCE`: Laboratoire de sciences
- `INFORMATIQUE`: Salle informatique
- `AMPHI`: Amphithéâtre
- `REUNION`: Salle de réunion
- `SPORT`: Salle de sport / Gymnase
- `ADMINISTRATIF`: Bureau administratif
- `AUTRE`: Autre type de local

## 🔒 Sécurité

- **Isolation multi-tenant:** Chaque école ne peut accéder qu'à ses propres locaux
- **Validation stricte:** Toutes les entrées sont validées avec Zod
- **Vérifications de cohérence:** Les relations entre bâtiments et salles sont vérifiées
- **Gestion des erreurs:** Messages d'erreur explicites et codes HTTP appropriés

## 🚀 Prochaines Fonctionnalités

- [ ] Système de réservation de salles
- [ ] Gestion des conflits de réservation
- [ ] Export PDF des plans de bâtiment
- [ ] Historique des modifications
- [ ] Notifications de disponibilité

## 📂 Structure des Fichiers

```
locaux/
├── locaux.schema.ts      # Schémas de validation Zod
├── locaux.service.ts     # Logique métier
├── locaux.controller.ts  # Contrôleurs Express
├── locaux.routes.ts      # Définition des routes
└── README.md            # Documentation (ce fichier)
```

## 💡 Exemples d'Utilisation

### Créer un bâtiment avec plusieurs salles

1. **Créer le bâtiment:**
```bash
curl -X POST http://localhost:5000/api/logistique/locaux/batiments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Pavillon des Sciences",
    "code": "SCI",
    "nbEtages": 2
  }'
```

2. **Créer des salles dans ce bâtiment:**
```bash
curl -X POST http://localhost:5000/api/logistique/locaux/salles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Labo Chimie 1",
    "type": "LABO_SCIENCE",
    "etage": 1,
    "capacite": 20,
    "batimentId": "<batiment_id>"
  }'
```

### Mettre une salle en maintenance

```bash
curl -X PUT http://localhost:5000/api/logistique/locaux/salles/<salle_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "statut": "MAINTENANCE"
  }'
```

### Obtenir toutes les salles disponibles d'un bâtiment

```bash
curl -X GET "http://localhost:5000/api/logistique/locaux/salles?batimentId=<id>&statut=DISPONIBLE" \
  -H "Authorization: Bearer <token>"
```

## 🐛 Gestion des Erreurs

### Erreurs communes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Données invalides | Validation Zod échouée |
| 403 | Accès non autorisé | Tentative d'accès aux locaux d'une autre école |
| 404 | Bâtiment/Salle introuvable | ID invalide ou supprimé |
| 410 | Endpoint obsolète | Utilisation d'anciens endpoints |
| 500 | Erreur serveur | Erreur interne |

## 🔧 Maintenance

### Migrations Prisma

Le module utilise les modèles `Batiment` et `Salle` du schema Prisma. Après toute modification du schema:

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

### Tests

TODO: Ajouter des tests unitaires et d'intégration

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.
