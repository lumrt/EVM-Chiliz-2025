# Guide de Test - Système d'Onboarding avec Upload

## Ce qui a été implémenté ✅

### 1. **Modal d'onboarding automatique**
- Se déclenche lors de la première connexion avec Privy
- Détecte automatiquement si l'utilisateur existe déjà en base

### 2. **Upload de photos de profil** 
- Composant `FileUpload` avec preview en temps réel
- Support des formats : JPG, PNG, GIF, WebP
- Taille maximale : 5MB
- Stockage dans `public/uploads/profiles/`
- Noms de fichiers uniques avec timestamp

### 3. **Formulaire complet**
- **Nom d'utilisateur** : Unique, validation alphanumerique + underscores
- **Nom d'affichage** : Nom public affiché
- **Bio** : Optionnel, max 500 caractères  
- **Photo de profil** : Upload de fichier avec preview

### 4. **Validation robuste**
- Validation côté client et serveur
- Messages d'erreur clairs en français
- Gestion des conflits (username déjà pris, etc.)

### 5. **Notifications toast**
- Succès lors de la création du profil
- Erreurs en cas de problème
- Animations fluides

### 6. **API complète**
- `POST /api/user/profile` - Créer un profil
- `GET /api/user/profile?wallet=address` - Récupérer un profil
- `PUT /api/user/profile` - Mettre à jour un profil
- `POST /api/upload/profile` - Upload d'images

## Comment tester 🧪

### 1. **Première connexion**
1. Allez sur `http://localhost:3000`
2. Cliquez sur "Connect Wallet"
3. Connectez-vous avec Privy (première fois)
4. ➡️ Le modal d'onboarding devrait s'afficher automatiquement

### 2. **Test de l'upload d'image**
1. Dans le modal, cliquez sur "Choisir une image"
2. Sélectionnez une image (JPG, PNG, GIF ou WebP)
3. ➡️ L'image devrait s'afficher en preview immédiatement
4. ➡️ L'upload se fait automatiquement

### 3. **Test des validations**
- Essayez un nom d'utilisateur trop court (< 3 caractères)
- Essayez des caractères spéciaux dans le username
- Laissez le nom d'affichage vide
- ➡️ Les erreurs devraient s'afficher en rouge

### 4. **Test de création réussie**
1. Remplissez tous les champs requis
2. Cliquez sur "Créer mon profil"
3. ➡️ Toast de succès + fermeture du modal
4. ➡️ Interface mise à jour avec le nom d'utilisateur

### 5. **Test de reconnexion**
1. Déconnectez-vous
2. Reconnectez-vous avec la même adresse wallet
3. ➡️ Le modal d'onboarding ne doit PAS s'afficher
4. ➡️ Vous devriez voir votre profil directement

## Fichiers créés/modifiés 📁

```
src/
├── components/
│   ├── OnboardingModal.tsx      # Modal d'onboarding (modifié)
│   ├── FileUpload.tsx           # Nouveau: Upload de fichiers
│   └── Toast.tsx                # Nouveau: Système de notifications
├── hooks/
│   └── useOnboarding.ts         # Nouveau: Logique d'onboarding
├── app/
│   ├── api/
│   │   ├── user/profile/route.ts    # Nouveau: CRUD utilisateur
│   │   └── upload/profile/route.ts  # Nouveau: Upload d'images
│   ├── page.tsx                 # Modifié: Intégration onboarding
│   ├── providers.tsx            # Modifié: Ajout ToastProvider
│   └── globals.css              # Modifié: Animations toast
└── public/uploads/profiles/     # Nouveau: Stockage images
```

## États possibles 🔄

- **`null`** : Chargement en cours, vérification du profil
- **`false`** : Onboarding requis (première connexion) 
- **`true`** : Profil existant, onboarding terminé

## Fonctionnalités avancées 🚀

- **Upload avec preview** : Voir l'image avant validation
- **Gestion d'erreurs complète** : Upload, validation, conflits
- **Responsive design** : Fonctionne sur mobile
- **Noms de fichiers uniques** : Évite les conflits
- **Optimisation performances** : Hooks personnalisés, batch operations

Le système est maintenant prêt pour la production ! 🎉
