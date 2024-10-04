## Description

Les Echos - test dev back end - Joel Abenhaim

## Installation et mise en route

### Cloner le projet

```bash
$ git clone <url>
$ cd lesechos-jabenhaim-backend
```

### Installer les dépendances

```bash
$ npm install
```

### Initialiser la base de données

```bash
$ npm run prisma:generate
```

### Lancer le projet

```bash
$ npm run start:dev
```

OU utiliser VSCODE debugger (le launch.json est pré-configuré)

### Accéder à swagger pour tester les endpoints

http://localhost:3000/swagger

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Developer notes

### Après modification de prisma.service.ts, créer une migration avec cette syntaxe

npm run prisma:migrate NameOfMigration
npm run prisma:status
npm run prisma:generate
