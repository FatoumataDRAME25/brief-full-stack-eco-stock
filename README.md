# Eco-Stock — Documentation complète du projet

Plateforme de gestion d'entrepôts et de stocks alimentaires, composée d'une API backend **Django REST Framework** et d'un frontend **Angular** (standalone components, mode zoneless).

Ce document récapitule l'intégralité du travail réalisé : architecture, authentification, modules fonctionnels, formulaires, pièges rencontrés et solutions apportées.

---

## Table des matières

1. [Architecture générale](#1-architecture-générale)
2. [Backend Django — Configuration](#2-backend-django--configuration)
3. [Frontend Angular — Fondations](#3-frontend-angular--fondations)
4. [Authentification (JWT)](#4-authentification-jwt)
5. [Module Warehouse (Entrepôts)](#5-module-warehouse-entrepôts)
6. [Module Product (Produits)](#6-module-product-produits)
7. [Dashboard](#7-dashboard)
8. [Navbar : utilisateur connecté et recherche globale](#8-navbar--utilisateur-connecté-et-recherche-globale)
9. [Validation des formulaires](#9-validation-des-formulaires)
10. [State Management centralisé (Signals partagés)](#10-state-management-centralisé-signals-partagés)
11. [Le piège du mode zoneless (très important)](#11-le-piège-du-mode-zoneless-très-important)
12. [Pièges rencontrés et leçons apprises](#12-pièges-rencontrés-et-leçons-apprises)
13. [Limitations connues et pistes d'amélioration](#13-limitations-connues-et-pistes-damélioration)

---

## 1. Architecture générale

```
┌─────────────────────┐         HTTP / JSON          ┌──────────────────────┐
│   Angular (SPA)      │ ────────────────────────────▶ │  Django REST Framework│
│   http://localhost:4200│ ◀──────────────────────────  │  http://127.0.0.1:8000│
└─────────────────────┘         JWT (Bearer token)     └──────────────────────┘
```

- **Backend** : Django 6 + Django REST Framework + `djangorestframework_simplejwt` (authentification par JWT) + `drf-spectacular` 
    (documentation OpenAPI/Swagger) + `django-cors-headers`.
- **Frontend** : Angular 22, composants **standalone** (pas de `NgModule`),
 **mode zoneless** (pas de `zone.js`), Reactive Forms, Angular Signals pour l'état réactif.
- **Base de données** : SQLite (par défaut Django).

### Modèles Django

```python
class Warehouse(models.Model):
    nom = models.CharField(max_length=100)
    localisation = models.CharField(max_length=200)
    capacite = models.IntegerField()

class Product(models.Model):
    ETAT_CHOICES = [
        ("disponible", "Disponible"),
        ("reserve", "Réservé"),
        ("perime", "Périmé"),
    ]
    nom = models.CharField(max_length=100)
    quantite = models.IntegerField()
    utilisateur = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    date_expiration = models.DateTimeField()  # corrigé, voir section 2.3
    etat = models.CharField(max_length=20, choices=ETAT_CHOICES, default="disponible")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name="products")
```

### Endpoints API principaux

| Méthode | URL | Description |
|---|---|---|
| POST | `/api/token/` | Connexion (renvoie `access` + `refresh`) |
| POST | `/api/token/refresh/` | Rafraîchissement du token d'accès |
| GET/POST | `/api/warehouses/` | Liste / création d'entrepôts |
| GET/PUT/PATCH/DELETE | `/api/warehouses/<id>/` | Détail / modification / suppression |
| GET | `/api/warehouses/<id>/audit/` | Statistiques d'un entrepôt (total produits) |
| GET/POST | `/api/products/` | Liste / création de produits |
| GET/PUT/PATCH/DELETE | `/api/products/<id>/` | Détail / modification / suppression |
| POST | `/api/products/<id>/transfer/` | Transfert vers un autre entrepôt (`{ warehouse_id }`) |

---

## 2. Backend Django — Configuration

### 2.1 CORS

Le frontend Angular (`localhost:4200`) et le backend Django (`127.0.0.1:8000`) sont sur des ports différents. Sans configuration, le navigateur bloque toute requête entre les deux (politique de sécurité **Same-Origin**).

**Installation :**
```bash
pip install django-cors-headers
```

**`requirements.txt`** :
```
django-cors-headers==4.6.0
```

**`EcoStock/settings.py`** :
```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    'stock',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # placé le plus haut possible
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]
CORS_ALLOW_CREDENTIALS = True
```

### 2.2 Contrainte de version PyYAML

Le fichier `requirements.txt` pinnait `PyYAML==6.0.3`, une version trop récente pour certains environnements Python. Assoupli en :
```
PyYAML>=6.0,<7.0
```

### 2.3 Correction du champ `date_expiration`

**Problème identifié** : le champ était défini avec `auto_now_add=True`, ce qui force Django à y inscrire automatiquement la date de **création** de l'enregistrement, et **interdit** toute modification manuelle (même via l'API). Résultat : tous les produits auraient une date d'expiration égale à leur date de création, rendant le champ inutilisable pour son vrai rôle métier.

**Correction appliquée :**
```python
# Avant
date_expiration = models.DateTimeField(auto_now_add=True)

# Après
date_expiration = models.DateTimeField()
```

Une migration Django (`makemigrations` + `migrate`) a été nécessaire, avec fourniture d'une valeur par défaut pour les enregistrements existants.

---

## 3. Frontend Angular — Fondations

### 3.1 Configuration de l'environnement

Fichier `src/env.ts` :
```typescript
export const environnement = {
  production: false,
  apiurl: "http://127.0.0.1:8000/api/"
}
```

⚠️ **Point d'attention** : `apiurl` se termine déjà par un `/`. Toute URL construite dans les services ne doit **jamais** ajouter de `/` supplémentaire avant le nom de la ressource, sous peine d'obtenir un double slash (`api//products/`) qui provoque une erreur 404.

### 3.2 `app.config.ts`

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
  ],
};
```

`provideHttpClient()` ne doit être appelé **qu'une seule fois** dans toute l'application, avec tous les intercepteurs regroupés dans le même `withInterceptors([...])`.

### 3.3 Structure des dossiers (composants)

```
src/app/components/
├── auth/
│   ├── login/
│   ├── guards/          (auth.guard.ts)
│   ├── interceptors/    (jwt.interceptor.ts)
│   └── services/        (login.service.ts)
├── dashboard/
├── layout/
├── products/
│   ├── product-list/
│   ├── product-detail/
│   ├── product-form/
│   ├── product-transfert-modal/
│   ├── product-tansfert/   (page statique, voir section 12)
│   └── services/           (product.service.ts)
├── warehouse/
│   ├── warehouse-list/
│   ├── warehouse-card/
│   ├── warehouse-form/
│   ├── warehouse-audit/
│   └── services/            (warehouse.service.ts)
└── shared/
    ├── navbar/
    └── sidebar/
```

---

## 4. Authentification (JWT)

### 4.1 `LoginService`

```typescript
export interface IdentifyLogin {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private router = inject(Router)
  private http = inject(HttpClient)
  private baseUrl = `${environnement.apiurl}token/`

  login(identify: IdentifyLogin): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(this.baseUrl, identify).pipe(
      tap((reponse) => {
        localStorage.setItem('access_token', reponse.access);
        localStorage.setItem('refresh_token', reponse.refresh);
        localStorage.setItem('username', identify.username);
      })
    )
  }

  getAccessToken(): string | null { return localStorage.getItem('access_token'); }
  getRefreshToken(): string | null { return localStorage.getItem('refresh_token'); }
  getUsername(): string | null { return localStorage.getItem('username'); }

  logout(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('username')
    this.router.navigate(['/login'])
  }

  isLoggedIn(): boolean {
    return this.getAccessToken() !== null;
  }
}
```

**Choix de conception** : le token est stocké dans `localStorage` (persistant après fermeture du navigateur). Alternative plus sûre contre le XSS mais plus complexe : variable en mémoire + cookie `httpOnly` côté serveur (non implémenté ici).

Le `username` est stocké au moment du login (déjà connu depuis le formulaire), plutôt que de créer un endpoint `/me/` côté Django ou de décoder le JWT (qui ne contient pas le username par défaut avec SimpleJWT).

### 4.2 Guard de route (`auth.guard.ts`)

```typescript
export const monGuard: CanActivateFn = () => {
  const loginService = inject(LoginService)
  const router = inject(Router)

  if (loginService.isLoggedIn()) {
    return true
  } else {
    router.navigate(['/login'])
    return false
  }
};
```

Branché sur la route parente (`Layout`) dans `app.routes.ts`, ce qui protège automatiquement toutes ses routes enfants (`dashboard`, `warehouses`, `products`...).

### 4.3 Intercepteur JWT (`jwt.interceptor.ts`)

```typescript
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService)
  const token = loginService.getAccessToken()
  const clonedreq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  })
  if (token) {
    return next(clonedreq)
  } else {
    return next(req)
  }
}
```

Ajoute automatiquement l'en-tête `Authorization: Bearer <token>` à chaque requête HTTP sortante, si l'utilisateur est connecté.

> ℹ️ **Non implémenté** : le rafraîchissement automatique du token en cas de 401 (réponse expirée). Actuellement, une expiration de token redirige l'utilisateur vers une erreur plutôt que de rafraîchir silencieusement via `/token/refresh/`.

---

## 5. Module Warehouse (Entrepôts)

### 5.1 `WarehouseService`

```typescript
export interface Warehouse {
  id: number;
  nom: string;
  localisation: string;
  capacite: number;
}

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private http = inject(HttpClient)
  private baseUrl = `${environnement.apiurl}warehouses/`

  getWarehouse(): Observable<Warehouse[]> { return this.http.get<Warehouse[]>(this.baseUrl); }
  getById(id: number): Observable<Warehouse> { return this.http.get<Warehouse>(`${this.baseUrl}${id}/`); }
  addWarehouse(w: Omit<Warehouse, 'id'>): Observable<Warehouse> { return this.http.post<Warehouse>(this.baseUrl, w); }
  updateWarehouse(w: Omit<Warehouse, 'id'>, id: number): Observable<Warehouse> { return this.http.patch<Warehouse>(`${this.baseUrl}${id}/`, w); }
  deleteWarehouse(id: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}${id}/`); }
}
```

### 5.2 `WarehouseList`

- Lit `warehouses`/`products` directement depuis les Signals centralisés des services (`warehouseService.warehouses`, `productService.products` — voir [section 10](#10-state-management-centralisé-signals-partagés)), rafraîchis en `ngOnInit()` via `refreshWarehouses()`/`refreshProducts()`.
- Calcule `totalProduits(warehouseId)` par comptage local sur la liste de produits déjà chargée, sans appel API supplémentaire par entrepôt.
- Recherche par nom (`filterWarehouse()`), reliée avec `[(ngModel)]`.
- Ouvre `WarehouseForm` en modale pour la création (`showForm`) ; plus besoin d'écouter `(saved)` pour rafraîchir la liste — `addWarehouse()`/`updateWarehouse()` le font automatiquement via le service.

### 5.3 `WarehouseForm` (création **et** modification)

Formulaire réactif unique, utilisé dans les deux contextes grâce à un `@Input() warehouse: Warehouse | null`.

```typescript
onSubmit(): void {
  const payload = this.form.getRawValue()
  const request$ = this.warehouse !== null
    ? this.warehouseService.updateWarehouse(payload, this.warehouse.id)
    : this.warehouseService.addWarehouse(payload)

  request$.subscribe({
    next: (data) => { this.saved.emit(data); this.fermer.emit(); },
    error: (err) => { /* ... */ }
  })
}
```

Si `warehouse` est fourni (mode édition), `ngOnInit()` pré-remplit le formulaire via `form.patchValue(...)`.

Le titre de la modale et le libellé du bouton s'adaptent également au mode :
```html
@if (warehouse !== null) {
  <h2 class="text-lg font-semibold text-gray-800">Modifier l'entrepôt</h2>
} @else {
  <h2 class="text-lg font-semibold text-gray-800">Ajouter un entrepôt</h2>
}
```
Même principe sur le texte du bouton "Enregistrer" / "Enregistrer les modifications".

### 5.4 `WarehouseAudit`

Page de détail d'un entrepôt (route `/warehouses/:id/audit`) :
- L'entrepôt courant et ses produits sont dérivés des Signals centralisés via `computed()` (voir [section 10.4](#10-state-management-centralisé-signals-partagés)) : `warehouse` retrouve l'entrepôt correspondant à l'id de l'URL, `products` filtre la liste complète sur `p.warehouse === Number(this.warehouseId)`.
- Calcule les statistiques réelles : total produits, disponibles, réservés, périmés (via `.filter().length`).
- Permet modification (même `WarehouseForm` en mode édition) et suppression (avec confirmation via `confirm()`, placée **avant** l'appel API pour bloquer réellement l'action en cas d'annulation).

---

## 6. Module Product (Produits)

### 6.1 `ProductService`

```typescript
export interface Product {
  id: number;
  nom: string;
  quantite: number;
  date_expiration: string;
  etat: 'disponible' | 'reserve' | 'perime';
  utilisateur: number;
  warehouse: number;
}

export interface ProductTransferResponse {
  message: string;
  product: Product;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient)
  private baseUrl = `${environnement.apiurl}products/`

  getProduct(): Observable<Product[]> { return this.http.get<Product[]>(this.baseUrl); }
  getById(id: number): Observable<Product> { return this.http.get<Product>(`${this.baseUrl}${id}/`); }
  addProduct(p: Omit<Product, 'id' | 'utilisateur'>): Observable<Product> { return this.http.post<Product>(this.baseUrl, p); }
  updateProduct(p: Omit<Product, 'id' | 'utilisateur'>, id: number): Observable<Product> { return this.http.patch<Product>(`${this.baseUrl}${id}/`, p); }
  deleteProduct(id: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}${id}/`); }
  transfer(id: number, warehouseId: number): Observable<ProductTransferResponse> {
    return this.http.post<ProductTransferResponse>(`${this.baseUrl}${id}/transfer/`, { warehouse_id: warehouseId });
  }
}
```

`utilisateur` (l'utilisateur créateur) est géré automatiquement par Django et exclu des payloads envoyés depuis Angular.

### 6.2 `ProductList`

- Lit `products` directement depuis `productService.products` (Signal centralisé), rafraîchi via `refreshProducts()` ; charge séparément la liste des entrepôts pour résoudre le nom via `getWarehouseName(warehouseId)` (l'API ne renvoie qu'un id).
- **Recherche** par nom (`searchTerm`).
- **Filtres** : par entrepôt (`selectedWarehouseFilter`, `<select>` avec `[ngValue]` — obligatoire car la valeur est un `number`, pas une `string`) et par statut (`selectedStatusFilter`).
- `filteredProducts()` combine les 3 critères (`matchNom && matchWarehouse && matchStatus`).
- `(ngModelChange)="onFilterChange()"` sur chaque filtre réinitialise `currentPage` à 1 (pagination).
- **Pagination** : `paginatedProducts()` découpe `filteredProducts()` via `.slice()`, avec `totalPages()`, `nextPage()`, `previousPage()`, `goToPage()`, `startIndex()`/`endIndex()` pour l'affichage "Affichage de X-Y sur Z produits". *(Code fourni ; à retester en conditions réelles avec suffisamment de produits.)*
- Badges de statut colorés dynamiquement via `@switch (product.etat)`.

### 6.3 `ProductDetail`

Route `/products/:id` :
- `product` est un `computed()` dérivé de `productService.products()`, qui retrouve le produit dont l'id correspond au paramètre d'URL (voir [section 10.4](#10-state-management-centralisé-signals-partagés)) ; charge séparément la liste des entrepôts pour résoudre le nom.
- Actions : Modifier (`ProductForm` en mode édition), Supprimer (avec confirmation), Transférer (ouvre `ProductTransfertModal`).
- Le bouton "Transférer" est désactivé si `product()?.etat === 'perime'`.

### 6.4 `ProductForm` (création **et** modification)

Même principe que `WarehouseForm` : `@Input() product: Product | null`, ternaire dans `onSubmit()` entre `addProduct()`/`updateProduct()`. Champs : nom, quantité, date d'expiration (`type="date"`), état (`<select>`), entrepôt (`<select>` généré via `@for` sur la liste réelle d'entrepôts).

Comme pour `WarehouseForm`, le titre de la modale et le texte du bouton changent dynamiquement selon `product !== null` (mode édition) ou `null` (mode création) :
```html
@if (product !== null) {
  <h2 class="text-lg font-semibold text-gray-800">Modifier le produit</h2>
} @else {
  <h2 class="text-lg font-semibold text-gray-800">Ajouter un produit</h2>
}
```

### 6.5 `ProductTransfertModal`

- `@Input() product: Product | null` (le produit à transférer — **pas** un Signal, c'est un `@Input()` classique).
- Charge la liste des entrepôts pour le `<select>` "Nouvel entrepôt" (`[(ngModel)]="selectedWarehouseId"`).
- `onTransfer()` bloque l'action si le produit est périmé, sinon appelle `productService.transfer(...)` — la réponse étant imbriquée (`{ message, product }`), c'est `response.product` qui est émis via `saved.emit(...)`.
- Bouton "Transférer le produit" désactivé si aucun entrepôt choisi ou produit périmé.

> 💡 **Astuce de factorisation** : la condition `warehouse !== null` / `product !== null` (utilisée pour le titre et le texte du bouton dans `WarehouseForm`/`ProductForm`) peut être centralisée dans un getter du composant si elle est répétée à plusieurs endroits du template :
> ```typescript
> get isEditMode(): boolean {
>   return this.warehouse !== null; // ou this.product !== null selon le formulaire
> }
> ```
> et utilisée simplement via `@if (isEditMode) { ... } @else { ... }`.

---

## 7. Dashboard

`products` pointe directement vers `productService.products` (Signal centralisé, voir [section 10](#10-state-management-centralisé-signals-partagés)), rafraîchi via `refreshProducts()` en `ngOnInit()`. Statistiques calculées **exclusivement** à partir des vraies données (aucune valeur inventée) :

```typescript
totalProduit(): number { return this.products().length }
totalEntrepots(): number { return this.warehouses().length }
produitDisponibles(): number { return this.products().filter(d => d.etat === "disponible").length }
produitReserves(): number { return this.products().filter(r => r.etat === "reserve").length }
produitPerimes(): number { return this.products().filter(p => p.etat === "perime").length }

produitsAlerteExpiration(): Product[] {
  const dansSeptJours = new Date();
  dansSeptJours.setDate(dansSeptJours.getDate() + 7);
  return this.products()
    .filter((p) => new Date(p.date_expiration) <= dansSeptJours)
    .sort((a, b) => new Date(a.date_expiration).getTime() - new Date(b.date_expiration).getTime());
}
```

Le tableau "Activité Récente" de la maquette d'origine (avec des notions d'"Entrée/Sortie/Transfert" et de statuts "En cours/Annulé") a été **remplacé** par "Alertes Expiration", car aucun modèle de journal d'activité n'existe côté backend — afficher cette maquette telle quelle aurait nécessité des données entièrement fictives.

---

## 8. Navbar : utilisateur connecté et recherche globale

### 8.1 Utilisateur connecté
```typescript
username = this.loginService.getUsername();
```
Affiché directement dans le template (`{{ username }}`), à la place du nom statique "Jean Dupont" de la maquette d'origine.

### 8.2 Recherche globale
Recherche portant **uniquement sur les entrepôts** (pas sur les produits), affichée dans un menu déroulant sous la barre de recherche. `warehouses` pointe vers `warehouseService.warehouses` (Signal centralisé) :
```typescript
matchingWarehouses(): Warehouse[] {
  if (this.searchTerm.trim() === '') {
    return [];
  }
  return this.warehouses()
    .filter((w) => w.nom.toLowerCase().includes(this.searchTerm.toLowerCase()))
    .slice(0, 5);
}
```
Chaque résultat est un lien (`routerLink`) vers la page d'audit de l'entrepôt correspondant ; le clic vide `searchTerm`, ce qui referme automatiquement le menu.

⚠️ **Piège rencontré** : le conteneur du menu déroulant (`<div class="absolute top-full ...">`) doit être placé **à l'intérieur** du `@if (matchingWarehouses().length > 0)`, pas autour de lui — sinon une boîte blanche vide reste visible en permanence sous la barre de recherche, même quand `searchTerm` est vide.

*(Une version incluant aussi les produits avait été envisagée en cours de développement, mais la recherche navbar a finalement été limitée aux entrepôts uniquement — `ProductService` n'est donc pas injecté dans ce composant.)*

---

## 9. Validation des formulaires

### 9.1 Classes CSS globales réutilisables

`src/styles.css` :
```css
@import 'tailwindcss';

.input-error {
  @apply border-red-300 focus:ring-red-400;
}

.form-error-message {
  @apply text-xs text-red-500 mt-1 flex items-center gap-1;
}
```

### 9.2 Pattern appliqué à chaque champ

```html
<input formControlName="nom"
  class="..."
  [class.input-error]="form.get('nom')!.invalid && form.get('nom')!.touched"
/>
@if (form.get('nom')!.invalid && form.get('nom')!.touched) {
  <p class="form-error-message">
    <i class="fa-solid fa-circle-exclamation"></i>
    Message d'erreur
  </p>
}
```

La condition `.touched` évite d'afficher les erreurs dès l'ouverture du formulaire, avant toute interaction utilisateur.

### 9.3 Boutons désactivés tant que le formulaire est invalide

```html
<button type="submit" [disabled]="form.invalid" class="... disabled:opacity-50 disabled:cursor-not-allowed">
```

### 9.4 Erreurs serveur (identifiants incorrects, etc.)

Distinctes des erreurs de validation client — gérées via un Signal `errorMessage`, réinitialisé automatiquement dès que l'utilisateur retouche au formulaire :
```typescript
errorMessage = signal<string | null>(null);

constructor() {
  this.form.valueChanges.subscribe(() => this.errorMessage.set(null));
}
```

---

## 10. State Management centralisé (Signals partagés)

### 10.1 Le problème à résoudre

Initialement, chaque composant (`ProductList`, `Dashboard`, `Navbar`, `WarehouseAudit`...) déclarait **son propre** Signal local (`products = signal<Product[]>([])`), rempli indépendamment via son propre appel à `productService.getProduct().subscribe(...)`.

**Conséquence concrète** : une modification faite sur une page (ex: transférer un produit depuis `ProductDetail`) n'était **pas répercutée** sur un autre composant déjà chargé (ex: `Dashboard`, si on y revenait sans recharger la page) — chaque composant avait sa **propre copie**, potentiellement obsolète, de la même donnée.

C'est exactement le problème que des outils comme **Pinia**, **Redux** ou la **Context API** résolvent dans l'écosystème Vue/React : garantir une **source de vérité unique**, partagée par toute l'application, pour que toute modification soit immédiatement visible partout.

### 10.2 La solution en Angular : le Signal vit dans le service

Pas besoin d'une librairie externe (type NgRx) pour un projet de cette taille — un `Signal` déclaré directement dans un service `providedIn: 'root'` est **une seule et même instance** pour toute l'application, exactement comme le serait un store Redux/Pinia.

```typescript
@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient)
  private baseUrl = `${environnement.apiurl}products/`

  // Source de vérité unique. "private" : seul ce service peut le modifier.
  private productsSignal = signal<Product[]>([]);

  // Exposé en LECTURE SEULE : les composants lisent, mais ne peuvent jamais
  // faire products.set(...) directement — ils doivent passer par les méthodes du service.
  readonly products = this.productsSignal.asReadonly();

  // Recharge la liste et notifie TOUS les composants qui lisent products().
  refreshProducts(): void {
    this.getProduct().subscribe({
      next: (data) => this.productsSignal.set(data),
      error: (err) => console.log(err),
    });
  }

  getProduct(): Observable<Product[]> { return this.http.get<Product[]>(this.baseUrl); }

  addProduct(product: Omit<Product, 'id' | 'utilisateur'>): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product).pipe(
      tap(() => this.refreshProducts())  // rafraîchit automatiquement TOUT le monde
    );
  }

  updateProduct(product: Omit<Product, 'id' | 'utilisateur'>, id: number): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}${id}/`, product).pipe(
      tap(() => this.refreshProducts())
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${id}/`).pipe(
      tap(() => this.refreshProducts())
    );
  }

  transfer(id: number, warehouseId: number): Observable<ProductTransferResponse> {
    return this.http.post<ProductTransferResponse>(`${this.baseUrl}${id}/transfer/`, { warehouse_id: warehouseId }).pipe(
      tap(() => this.refreshProducts())
    );
  }
}
```

Même principe appliqué à `WarehouseService` (`WarehouseSignal` privé, `warehouses` en lecture seule, `refreshWarehouses()`, `tap()` sur `addWarehouse`/`updateWarehouse`/`deleteWarehouse`).

### 10.3 Ce que ça change dans les composants

Chaque composant qui affichait une liste (`ProductList`, `Dashboard`, `WarehouseList`, `Navbar`, `ProductForm`, `ProductTransfertModal`) a été simplifié :

```typescript
// Avant
products = signal<Product[]>([]);
fetchProducts(): void {
  this.productService.getProduct().subscribe({ next: (data) => this.products.set(data), ... });
}

// Après
products = this.productService.products;   // pointe directement vers le Signal partagé
// fetchProducts() n'existe plus : ngOnInit() appelle juste this.productService.refreshProducts()
```

**Le point clé** : les méthodes du service (`addProduct`, `updateProduct`, `deleteProduct`, `transfer`) déclenchent **elles-mêmes** `refreshProducts()` en interne (via `tap()`). Les composants n'ont donc plus besoin de rafraîchir quoi que ce soit après une action — ça se fait automatiquement, où que l'action ait été déclenchée dans l'application.

### 10.4 Cas particulier : dériver un élément unique avec `computed()`

Certains composants (`ProductDetail`, `WarehouseAudit`) n'ont pas besoin de la **liste complète**, mais d'**un élément précis** (le produit/entrepôt de l'URL) ou d'une **sous-liste filtrée**. Dans ce cas, un simple pointage direct ne suffit pas — on utilise `computed()`, qui crée un Signal **dérivé**, recalculé automatiquement à chaque changement de sa source :

```typescript
// ProductDetail : un seul produit, retrouvé dans la liste centralisée
product = computed(() => {
  return this.productService.products().find((p) => p.id === Number(this.productId)) ?? null;
});

// WarehouseAudit : uniquement les produits DE CET entrepôt
products = computed(() => {
  return this.productService.products().filter((p) => p.warehouse === Number(this.warehouseId));
});

// WarehouseAudit : l'entrepôt courant, retrouvé dans la liste centralisée
warehouse = computed(() => {
  return this.warehouseService.warehouses().find((w) => w.id === Number(this.warehouseId)) ?? null;
});
```

`?? null` (opérateur de coalescence des nuls) remplace le `undefined` que retournerait `.find()` en cas d'échec par `null`, pour rester cohérent avec le typage `Product | null` / `Warehouse | null` utilisé dans le reste du projet (notamment `@Input() product: Product | null` sur `ProductTransfertModal`/`ProductForm`).

**Avantage de `computed()` sur un `.filter()`/`.find()` appelé directement dans le template** : le résultat est mis en cache et recalculé **uniquement** quand `productService.products()` change réellement, pas à chaque cycle de détection de changement.

### 10.5 Composants concernés par la centralisation

| Composant               | Avant                                                        | Après                                              |
|---|---|---|
| `ProductList`           | Signal local + `fetchProducts()`                             | `products = productService.products` |
| `ProductDetail`         | `getById()` dans un Signal dédié                             |  `product = computed(...)` dérivé de la liste centralisée |
| `Dashboard`             | Signal local + `fetchProduit()`                              | `products = productService.products` |
| `WarehouseList`         | Signal local + `fetchWarehouses()`                           | `warehouses`/`products` pointent vers les services |
| `WarehouseAudit`        | Deux appels dédiés (`getById` + produits filtrés localement) | Deux `computed()` dérivés des Signals centralisés |
| `Navbar`                | Signal local `products`                                      |`warehouses = warehouseService.warehouses` (recherche limitée  aux entrepôts,voir section 8.2) |
| `ProductForm`           | Signal local `warehouses`                                    | `warehouses = warehouseService.warehouses` |
| `ProductTransfertModal` | Signal local `warehouses`                                    | `warehouses = warehouseService.warehouses` |
| `WarehouseForm`         | —                                                            | Inchangé (ne charge aucune liste, reçoit juste un `@Input()`) |

---

## 11. Le piège du mode zoneless (très important)

Ce projet Angular **n'utilise pas `zone.js`** (absent de `package.json` et de `main.ts`). Concrètement :

> **Sans `zone.js`, Angular ne redessine l'écran automatiquement que lorsqu'un `Signal` change de valeur** — assigner directement une propriété de classe classique (`this.data = value`) à l'intérieur d'un `.subscribe()` ne déclenche **aucun** rafraîchissement visuel, même si la donnée est bien mise à jour en mémoire.

**Symptôme rencontré** : après un F5, les données étaient bien récupérées (visible en `console.log`), mais rien ne s'affichait à l'écran — jusqu'à ce qu'un événement DOM (clic, frappe clavier) déclenche incidemment un nouveau cycle de rendu.

**Règle appliquée dans tout le projet** : toute donnée asynchrone affichée dans un template (`warehouses`, `products`, `errorMessage`, etc.) est systématiquement déclarée comme `signal<T>(valeurInitiale)`, mise à jour via `.set(...)`, et lue dans le HTML avec des parenthèses (`warehouses()`, `errorMessage()`).

---

## 12. Pièges rencontrés et leçons apprises

| Symptôme                                             | Cause                                   | Solution |
|---|---|---|
| Erreur CORS "Blocage d'une requête multiorigine"     | Serveur Django non démarré              | Vérifier que `runserver` tourne avant de tester |
| 404 sur `/api//products/`                            | `apiurl` se termine déjà par `/`, un `/` supplémentaire ajouté dans le service | Ne jamais préfixer `/` devant le nom de ressource |
| Formulaire toujours "disponible" quel que soit le choix | `<select>` sans `formControlName` | Toujours vérifier que chaque champ du HTML est bien relié au `FormGroup` |
| `NG01050 formControlName must be used with a parent formGroup` | `<form>` sans `[formGroup]="form"` | Ajouter `[formGroup]` et `(ngSubmit)` sur la balise `<form>` |
| Filtre par entrepôt ne retourne jamais de résultat | `<option [value]="warehouse.id">` convertit l'id en `string`, alors que la comparaison se fait avec un `number` | Utiliser `[ngValue]` au lieu de `[value]` pour toute valeur non-string |
| `Cannot read properties of undefined` après injection | Faute de frappe `constructtor` au lieu de `constructor` | Vérifier l'orthographe exacte des méthodes réservées |
| Requête toujours vers `/products/0/` | Binding `[id]="warehouse.id"` manquant sur `<app-warehouse-card>` dans la boucle `@for` | Vérifier que **tous** les `@Input()` d'un composant enfant sont bien reliés dans la boucle parente |
| Suppression exécutée même en cliquant "Annuler" | `confirm(...)` placé **après** l'appel HTTP au lieu d'avant | Toujours placer `confirm()` en première ligne, avec un `if (!confirmation) return;` |
| Erreur de type `Omit<Product, 'id'>` incompatible | Champs obligatoires de l'interface non exclus du payload de création (`date_expiration`, `utilisateur`) | Étendre `Omit<Product, 'id' | 'champ1' | 'champ2'>` selon les champs réellement gérés par le backend |
| `type="email"` bloque la soumission silencieusement | Validation native du navigateur incompatible avec un `username` non-email | Utiliser `type="text"` pour un champ qui n'est pas une vraie adresse e-mail |
| Données reçues (visibles en `console.log`) mais rien ne s'affiche à l'écran | Propriété de classe classique modifiée dans un `.subscribe()`, en mode zoneless (voir [section 11](#11-le-piège-du-mode-zoneless-très-important)) | Utiliser un `Signal` (`.set(...)`) au lieu d'une simple propriété |
| Boîte blanche vide flottant en permanence sous une barre de recherche | Le conteneur du menu déroulant était placé **autour** du `@if`, pas à l'intérieur | Englober le conteneur **entier** (pas seulement son contenu) dans la condition `@if` |
| Après centralisation, `product()`/`warehouse()` toujours `null`, ou liste jamais filtrée par entrepôt | Variable d'id de route (`productId`/`warehouseId`) jamais assignée dans `ngOnInit()`, ou `.filter()` oublié après être passé à un `computed()` sur la liste complète | Vérifier que l'id de l'URL est bien récupéré, et que le `computed()` filtre bien la liste centralisée plutôt que de la pointer telle quelle |

---

## 13. Limitations connues et pistes d'amélioration

- **Historique des transferts** : aucun modèle `Transfer` n'existe côté Django — seul l'état *actuel* de chaque produit est connu (son `warehouse` courant), pas l'historique de ses déplacements. La page **"Transferts de Stock"** (`product-tansfert`) reste donc **statique**, faute de données réelles à afficher. Pour l'implémenter réellement, il faudrait créer un modèle d'historique côté backend et l'alimenter à chaque appel à l'action `transfer`.
- **Rafraîchissement automatique du token JWT** : non implémenté dans l'intercepteur — une expiration du token d'accès nécessite actuellement une reconnexion manuelle plutôt qu'un rafraîchissement silencieux via `/token/refresh/`.
- **Pagination** (`ProductList`) : le code a été fourni dans son intégralité (découpage, navigation, réinitialisation au changement de filtre) mais n'a pas été formellement retesté en conditions réelles avec un grand volume de produits.
- **Champ SKU** : présent dans la maquette `product-detail` d'origine (`SKU-IND-X200-001`), mais n'existe pas dans le modèle `Product` — resté en valeur fictive/statique.
- **Rôle utilisateur** ("Gestionnaire de Stock" dans la navbar) : reste statique, le modèle `User` de Django ne portant aucune notion de rôle/poste.
