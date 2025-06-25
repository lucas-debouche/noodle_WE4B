import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, tap, throwError, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string[];
  photo?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth'; // URL de l'API backend
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // NOUVEAU: Flag pour savoir si l'utilisateur a été chargé
  private userLoaded = false;

  constructor(private http: HttpClient) {
    // NOUVEAU: Charger l'utilisateur au démarrage si on a un token
    if (this.isLoggedIn()) {
      this.initializeUser();
    }
  }

  // Méthode pour la connexion utilisateur (CONSERVÉE)
  login(email: string, mot_passe: string): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/auth/login', { email, mot_passe }).pipe(
      tap(response => {
        console.log('🔐 Connexion réussie:', response);
        // Stocker le token dans le localStorage
        localStorage.setItem('token', response.token);
        // Charger les infos utilisateur si disponibles dans la réponse
        if (response.user) {
          this.currentUserSubject.next(response.user);
          this.userLoaded = true;
          console.log('👤 Utilisateur chargé depuis la réponse login:', response.user.nom, response.user.prenom);
        } else {
          // Sinon, charger les infos utilisateur séparément
          this.loadCurrentUser();
        }
      })
    );
  }

  // Méthode pour l'inscription utilisateur (CONSERVÉE)
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Méthode de déconnexion (CONSERVÉE)
  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.userLoaded = false;
    console.log('👋 Déconnexion effectuée');
  }

  // Méthode de vérification de connexion (CONSERVÉE)
  isLoggedIn(): boolean {
    const token = localStorage.getItem('token'); // Vérifie si un token est présent
    return !!token; // Retourne true si le token existe
  }

  // MODIFIÉE: Chargement de l'utilisateur actuel (version observable pour les guards)
  getCurrentUserFromServer(): Observable<User | null> {
    if (!this.isLoggedIn()) {
      console.log('❌ Pas de token, impossible de charger l\'utilisateur');
      return of(null);
    }

    const headers = this.getAuthHeaders();
    console.log('🔄 Chargement de l\'utilisateur depuis le serveur...');

    return this.http.get<User>('http://localhost:3000/api/utilisateur/current', { headers }).pipe(
      map(user => {
        console.log('✅ Utilisateur chargé depuis le serveur:', user.nom, user.prenom);
        console.log('🎭 Rôles:', user.role);
        this.currentUserSubject.next(user);
        this.userLoaded = true;
        return user;
      }),
      catchError(error => {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
        if (error.status === 401) {
          console.log('🔒 Token expiré, déconnexion...');
          this.logout();
        }
        return of(null);
      })
    );
  }

  // CONSERVÉE: Chargement de l'utilisateur actuel (version void pour usage interne)
  private loadCurrentUser(): void {
    if (this.isLoggedIn()) {
      const headers = this.getAuthHeaders();
      console.log('🔄 Chargement utilisateur interne...');
      this.http.get<User>('http://localhost:3000/api/utilisateur/current', { headers }).subscribe(
        user => {
          console.log('👤 Utilisateur chargé (interne):', user.nom, user.prenom);
          this.currentUserSubject.next(user);
          this.userLoaded = true;
        },
        error => {
          console.error('❌ Erreur lors du chargement de l\'utilisateur (interne):', error);
          if (error.status === 401) {
            this.logout();
          }
        }
      );
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getToken(): string | null {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('Token récupéré:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // MODIFIÉE: Méthode d'initialisation
  initializeUser(): void {
    console.log('🚀 Initialisation de l\'utilisateur...');
    this.loadCurrentUser();
  }

  // NOUVEAU: Vérifier si l'utilisateur a été chargé
  isUserLoaded(): boolean {
    const loaded = this.userLoaded && this.getCurrentUserValue() !== null;
    console.log('📊 Utilisateur chargé:', loaded, '| userLoaded:', this.userLoaded, '| currentUser:', !!this.getCurrentUserValue());
    return loaded;
  }

  // MODIFIÉE: Amélioration des logs pour hasRole
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    console.log('🎭 Vérification du rôle:', role);
    console.log('👤 Utilisateur actuel:', user ? `${user.nom} ${user.prenom}` : 'null');
    console.log('🎭 Rôles utilisateur:', user ? user.role : 'aucun');

    const hasRole = user ? user.role.includes(role) : false;
    console.log('✅ A le rôle', role + ':', hasRole);

    return hasRole;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) {
      console.log('⚠️ hasAnyRole: Pas d\'utilisateur');
      return false;
    }
    const hasAnyRole = roles.some(role => user.role.includes(role));
    console.log('🎭 hasAnyRole:', roles, '→', hasAnyRole);
    return hasAnyRole;
  }

  // Méthodes spécifiques pour les permissions du forum (CONSERVÉES)
  canCreateForum(): boolean {
    return this.hasAnyRole(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']);
  }

  canPostMessage(): boolean {
    return this.hasAnyRole(['ROLE_USER', 'ROLE_PROF', 'ROLE_ADMIN']);
  }

  canModerate(): boolean {
    return this.hasAnyRole(['ROLE_PROF', 'ROLE_ADMIN']);
  }

  canDeleteForum(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  canEditMessage(messageAuthorId?: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;

    // Les profs et admins peuvent modifier tous les messages
    if (this.canModerate()) return true;

    // Les utilisateurs peuvent modifier leurs propres messages
    return messageAuthorId === user._id;
  }

  canDeleteMessage(messageAuthorId?: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;

    // Seuls les profs et admins peuvent supprimer des messages
    return this.canModerate();
  }
}
