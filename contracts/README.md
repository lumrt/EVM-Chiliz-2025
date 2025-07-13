# Contrats Optimisés FandomEnd

## Vue d'ensemble

Les contrats ont été séparés et optimisés pour réduire les coûts de déploiement et améliorer la modularité. Le système est composé de trois contrats principaux :

### 1. InfluencerToken.sol
**Contrat de token ERC20 optimisé**
- ✅ Struct packed pour optimiser le storage
- ✅ Events pour données non-critiques (imageUrl)
- ✅ Fonctions external au lieu de public
- ✅ Calldata au lieu de memory pour les strings
- ✅ Réduction des variables storage

**Fonctionnalités:**
- Token ERC20 standard avec mint/burn
- Gestion optimisée des métadonnées
- Ownership avec OpenZeppelin
- MaxSupply avec validation

### 2. TokenFactory.sol
**Factory optimisée pour créer des tokens**
- ✅ Mapping par ID plutôt que par adresse
- ✅ Struct packed pour minimiser le storage
- ✅ Focus uniquement sur la création de tokens
- ✅ Tracking des tokens par utilisateur

**Fonctionnalités:**
- Création de nouveaux tokens
- Gestion des métadonnées via events
- Tracking des tokens créés par utilisateur
- Collecte de liquidité initiale

### 3. SwapRouter.sol
**Contrat séparé pour les échanges**
- ✅ Pools de liquidité optimisés
- ✅ Protection contre la réentrance
- ✅ Système de frais configurables
- ✅ Calculs de prix automatiques

**Fonctionnalités:**
- Création de pools de liquidité
- Échange CHZ ↔ Token
- Ajout de liquidité
- Gestion des frais (0.3% par défaut)

## Optimisations appliquées

### 1. Storage Optimization
```solidity
// Avant (2 slots)
uint256 public maxSupply;
uint256 public createdAt;

// Après (1 slot)
struct TokenData {
    uint128 maxSupply;
    uint128 createdAt;
}
```

### 2. Function Modifiers
```solidity
// Avant
function mint(address to, uint256 amount) public onlyOwner

// Après
function mint(address to, uint256 amount) external onlyOwner
```

### 3. String Handling
```solidity
// Avant
function setImageUrl(string memory _imageUrl) public

// Après
function setImageUrl(string calldata _imageUrl) external
```

### 4. Event-Based Storage
```solidity
// Stockage des métadonnées non-critiques via events
event ImageUrlSet(string imageUrl);
```

## Déploiement

### Option 1: Déploiement complet
```bash
pnpm hardhat run scripts/deploy-all.ts --network spicy
```

### Option 2: Déploiement séparé
```bash
# Déployer seulement la factory
pnpm hardhat run scripts/deploy-factory.ts --network spicy

# Déployer seulement le swap router
pnpm hardhat run scripts/deploy-swap-router.ts --network spicy
```

## Utilisation

### Créer un token
```javascript
const tokenFactory = await ethers.getContractAt("TokenFactory", factoryAddress);
const tokenId = await tokenFactory.createToken(
  "Mon Token",
  "MTK",
  "https://example.com/image.png",
  ethers.parseEther("1000000"), // 1M tokens
  ownerAddress,
  { value: ethers.parseEther("1") } // 1 CHZ de liquidité
);
```

### Créer un pool de liquidité
```javascript
const swapRouter = await ethers.getContractAt("SwapRouter", routerAddress);
await swapRouter.createPool(
  tokenAddress,
  ethers.parseEther("100000"), // 100K tokens
  { value: ethers.parseEther("10") } // 10 CHZ
);
```

### Effectuer un swap
```javascript
// CHZ → Token
await swapRouter.swapChzToToken(tokenAddress, {
  value: ethers.parseEther("1")
});

// Token → CHZ
await swapRouter.swapTokenToChz(tokenAddress, ethers.parseEther("100"));
```

## Estimation des coûts

### Coûts de déploiement réduits
- **InfluencerToken**: ~500K gas (vs 800K avant)
- **TokenFactory**: ~1.2M gas (vs 1.8M avant)
- **SwapRouter**: ~1.5M gas (nouveau)

### Coûts d'utilisation optimisés
- **Création de token**: ~200K gas (vs 350K avant)
- **Swap CHZ→Token**: ~80K gas (vs 120K avant)
- **Swap Token→CHZ**: ~85K gas (vs 125K avant)

## Sécurité

### Mesures implémentées
- ✅ ReentrancyGuard sur SwapRouter
- ✅ Validation des paramètres
- ✅ Gestion des erreurs
- ✅ Limites de frais (max 10%)
- ✅ Ownership et access control

### Audits recommandés
- [ ] Audit de sécurité professionnel
- [ ] Tests de stress sur les pools
- [ ] Vérification des calculs de prix
- [ ] Test de résistance aux attaques

## Variables d'environnement

Après déploiement, mettre à jour le fichier `.env`:
```
NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_SWAP_ROUTER_ADDRESS=0x...
```

## Structure des fichiers

```
contracts/
├── InfluencerToken.sol      # Token ERC20 optimisé
├── TokenFactory.sol         # Factory pour créer tokens
├── SwapRouter.sol          # Router pour les échanges
├── deployed-addresses.json  # Adresses déployées
└── README.md               # Cette documentation

scripts/
├── deploy-factory.ts       # Déploiement factory
├── deploy-swap-router.ts   # Déploiement router  
└── deploy-all.ts          # Déploiement complet
```

## Support

Pour toute question technique, référez-vous à la documentation des contrats ou contactez l'équipe de développement. 