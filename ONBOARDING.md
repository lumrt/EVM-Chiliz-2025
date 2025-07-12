# Système d'Onboarding

Ce système d'onboarding permet aux utilisateurs de créer leur profil lors de leur première connexion avec Privy.

## Fonctionnement

### 1. Détection de la première connexion
Lorsqu'un utilisateur se connecte avec Privy, le hook `useOnboarding` vérifie automatiquement si l'utilisateur existe déjà dans la base de données en utilisant son adresse wallet.

### 2. Modal d'onboarding
Si l'utilisateur n'existe pas, un modal d'onboarding s'affiche automatiquement avec les champs suivants :
- **Nom d'utilisateur** (requis) : Unique, alphanumerique + underscores, minimum 3 caractères
- **Nom d'affichage** (requis) : Le nom qui sera affiché publiquement
- **Bio** (optionnel) : Description personnelle, maximum 500 caractères
- **Photo de profil** (optionnel) : Upload d'un fichier image (JPG, PNG, GIF, WebP, max 5MB)

### 3. Validation et sauvegarde
Le formulaire valide les données avant l'envoi :
- Vérifie l'unicité du nom d'utilisateur
- Valide les formats et longueurs
- Sauvegarde dans la base de données PostgreSQL via Prisma

### 4. Notifications
Le système utilise des toasts pour informer l'utilisateur :
- Succès lors de la création du profil
- Erreurs en cas de problème (username déjà pris, etc.)

## Structure des fichiers

```
src/
├── components/
│   ├── OnboardingModal.tsx      # Modal d'onboarding
│   ├── FileUpload.tsx           # Composant d'upload de fichiers
│   └── Toast.tsx                # Système de notifications
├── hooks/
│   └── useOnboarding.ts         # Hook pour gérer l'état d'onboarding
├── app/
│   ├── api/
│   │   ├── user/profile/
│   │   │   └── route.ts         # API routes pour CRUD utilisateur
│   │   └── upload/profile/
│   │       └── route.ts         # API route pour upload d'images
│   ├── page.tsx                 # Page principale avec logique d'onboarding
│   └── providers.tsx            # Providers (Privy + Toast)
├── prisma/
│   └── schema.prisma            # Schéma de base de données
└── public/
    └── uploads/
        └── profiles/            # Dossier de stockage des photos de profil
```

## API Endpoints

### GET `/api/user/profile?wallet={address}`
Récupère le profil d'un utilisateur par son adresse wallet.

### POST `/api/user/profile`
Crée un nouveau profil utilisateur.

### PUT `/api/user/profile`
Met à jour un profil utilisateur existant.

### POST `/api/upload/profile`
Upload une image de profil et retourne l'URL publique du fichier uploadé.

## Gestion des fichiers

Les images de profil sont stockées dans `public/uploads/profiles/` avec un nom unique généré automatiquement.

Formats supportés : JPG, PNG, GIF, WebP
Taille maximale : 5MB

Les fichiers uploadés sont automatiquement optimisés et stockés localement.

## États de l'onboarding

- `null` : Chargement en cours
- `false` : Onboarding nécessaire (première connexion)
- `true` : Onboarding terminé (utilisateur existant)

## Utilisation

L'onboarding est entièrement automatique. Il se déclenche lors de la première connexion de l'utilisateur et ne s'affiche plus une fois le profil créé.

Les développeurs peuvent utiliser le hook `useOnboarding` dans d'autres composants pour accéder aux informations du profil utilisateur :

```tsx
const { isOnboardingComplete, userProfile, isLoading } = useOnboarding();
```
