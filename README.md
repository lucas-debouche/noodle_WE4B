# Noodle_WE4B

## Description

Noodle_WE4B est une application web complète utilisant Angular pour le frontend et Node.js pour le backend. Elle intègre une authentification sécurisée via JSON Web Tokens (JWT) et utilise MongoDB comme base de données.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les outils suivants :

- **Node.js** (version 16 ou supérieure) : [Télécharger Node.js](https://nodejs.org/)
- **npm** : Inclus avec Node.js.
- **MongoDB** : Une instance MongoDB fonctionnelle.

---

## Installation

### 1. Cloner le projet

Clonez le dépôt GitHub :
```bash
git clone https://github.com/lucas-debouche/noodle_WE4B.git
```

Créez 3 terminaux et renommez-les pour faciliter la gestion du projet.
- Un pour le backend
- Un pour le frontend
- Un pour la base de données

Accédez au répertoire cloné sur chaque terminal:
```bash
  cd noodle_WE4B
```

---

## Mise en place de la base de données

Pour restaurer la base de données complète `noodle`, prête à l'emploi, suivez ces étapes :

### Étape 1 : S'assurer que MongoDB est en cours d'exécution

Lancez votre instance MongoDB locale.

```bash 
  mongosh
``` 

### Étape 2 : Restaurer le dossier `dump`

Le dossier `dump`, situé dans le répertoire du projet, contient une sauvegarde complète de la base de données `noodle`. Pour la restaurer :

1. Accédez au dossier `noodle_WE4B` dans votre terminal si ce n'est pas déjà fait.

2. Exécutez la commande suivante pour importer la base de données `noodle` :
```bash 
  mongorestore --uri=mongodb://localhost:27017 --dir=dump
``` 

MongoDB restaurera automatiquement toutes les collections et les documents dans la base de données `noodle`.

### Étape 3 : Vérifier la restauration

1. Accédez à la console MongoDB :
   ```bash
   mongosh
   ```

2. Vérifiez que la base de données `noodle` existe :
   ```bash
   show databases
   ```

3. Changez pour la base de données `noodle` :
   ```bash
   use noodle
   ```

4. Listez les collections pour vérifier qu'elles ont bien été importées :
   ```bash
   show collections
   ```

## Configuration du backend

1. Accédez au dossier `backend` :
   ```bash
   cd backend
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez les variables d'environnement :
   - Créez un fichier `.env` dans le dossier `backend`
   - Modifiez le fichier `.env` avec les valeurs que je vous fournirai :
     ```plaintext
     JWT_SECRET=...
     ```

4. Démarrez le serveur backend :
   ```bash
   node server.js
   ```
   Le backend sera accessible à [http://localhost:3000](http://localhost:3000).

## Configuration du frontend

1. Installez les dépendances du frontend :
   ```bash
   npm install
   ```

2. Lancez l'application Angular :
   ```bash
   ng serve
   ```
   Le frontend sera accessible à [http://localhost:4200](http://localhost:4200).

---

## Structure du projet

Voici une vue d'ensemble de l'organisation des fichiers et répertoires :

```
noodle_WE4B
├── dump                # Dossier contenant la sauvegarde de la base de données
├── nouveaux_mdp.txt    # Fichier contenant les identifiants et mots de passe pour les tests
├── package.json         # Dépendances et scripts du projet
├── .idea              # Configuration de l'IDE (par exemple, IntelliJ IDEA)
├── .gitignore         # Fichiers et répertoires ignorés par Git
├── README.md          # Documentation du projet
├── noodle_WE4b
   ├── backend
   │   ├── models          # Modèles de données MongoDB
   │   ├── routes          # Routes API
   │   ├── security        # Gestion des JWT
   │   ├── .env            # Configuration des variables d'environnement
   │   ├── server.js       # Point d'entrée du backend
   │   └── package.json    # Dépendances et scripts backend
   ├── src
   │   ├── app             # Composants Angular
   │   └── ...             # Autres fichiers Angular
   ├── .gitignore          # Fichiers ignorés par Git
   └── package.json       # Dépendances et scripts du frontend
```
   
---

## Informations sur les utilisateurs

Le fichier `nouveaux_mdp.txt` contient des identifiants et mots de passe générés pour tester le projet.

---
