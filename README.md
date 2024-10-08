# Description

Les Echos - test dev back end - Joel Abenhaim

# Installation et mise en route

## Cloner le projet

```bash
git clone https://github.com/bonjourjoel/lesechos-jabenhaim-backend.git
```

```bash
cd lesechos-jabenhaim-backend
```

## Installer les dépendances

```bash
npm install
```

## Initialiser la base de données

```bash
npm run prisma:deploy
```

## Lancer le projet

```bash
npm run start:dev
```

OU utiliser VSCODE debugger (le launch.json est pré-configuré)

## Accéder à swagger pour tester les endpoints

Il y a une interface swagger intégrée au backend pour tester directement dans le navigateur:
http://localhost:3000/swagger

# Démo sur swagger

- Créer un user avec l'endpoint /users POST, en précisant userType=ADMIN (tout le monde peut le faire sans être authentifié, pour simplifier la démo)
- Se connecter avec l'endpoint de /auth/login
- en haut à droite de swagger, se connecter avec le bouton "Authorize" en enregistrant le jwt access token renvoyé par la connexion
- Utiliser les fonctionalités via swagger en mode connecté.
- Se déconnecter via le bouton swagger "Authorize" en haut à droite de la fenêtre, créer un compte avec userType=USER, se logguer avec, refaire "Authorize", et tester les autorisations.

# Exécuter les tests

```bash
npm run test
```

OU utiliser VSCODE debugger (le launch.json est pré-configuré)

# Désinstallation

Supprimer le répertoire est suffisant.

# Developer notes

### Après modification de schema.prisma, créer une migration avec cette syntaxe

```bash
npm run prisma:migrate NameOfMigration
npm run prisma:status
npm run prisma:generate
```
