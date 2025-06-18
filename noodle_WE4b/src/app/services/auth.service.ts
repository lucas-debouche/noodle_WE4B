import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, tap, throwError, BehaviorSubject } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  // Méthode pour la connexion utilisateur (CONSERVÉE)
  login(email: string, mot_passe: string): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/auth/login', { email, mot_passe }).pipe(
      tap(response => {
        // Stocker le token dans le localStorage
        localStorage.setItem('token', response.token);
        // Charger les infos utilisateur si disponibles dans la réponse
        if (response.user) {
          this.currentUserSubject.next(response.user);
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
  }

  // Méthode de vérification de connexion (CONSERVÉE)
  isLoggedIn(): boolean {
    const token = localStorage.getItem('token'); // Vérifie si un token est présent
    return !!token; // Retourne true si le token existe
  }

  // NOUVELLES MÉTHODES pour la gestion des permissions du forum
  private loadCurrentUser(): void {
    if (this.isLoggedIn()) {
      const headers = this.getAuthHeaders();
      this.http.get<User>('http://localhost:3000/api/utilisateur/current', { headers }).subscribe(
        user => {
          this.currentUserSubject.next(user);
        },
        error => {
          console.error('Erreur lors du chargement de l\'utilisateur:', error);
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


  getCurrentUserValue(): any  {
    return this.currentUserSubject.value;
  }

  initializeUser(): void {
    this.loadCurrentUser();
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.role.includes(role) : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    return roles.some(role => user.role.includes(role));
  }

  // Méthodes spécifiques pour les permissions du forum
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
