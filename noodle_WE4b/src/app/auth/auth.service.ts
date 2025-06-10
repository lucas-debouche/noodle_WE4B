import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse } from '@angular/common/http';
import {catchError, Observable, tap, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth'; // URL de l'API backend

  constructor(private http: HttpClient) {}

  // Méthode pour la connexion utilisateur
  login(email: string, mot_passe: string): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/auth/login', { email, mot_passe }).pipe(
      tap(response => {
        // Stocker le token dans le localStorage
        localStorage.setItem('authToken', response.token);
      })
    );
  }



  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.status === 401) {
      errorMessage = 'Utilisateur non trouvé ou identifiants incorrects.';
    } else if (error.status === 500) {
      errorMessage = 'Erreur interne du serveur.';
    }
    return throwError(() => new Error(errorMessage));
  }


  // Méthode pour l'inscription utilisateur
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Méthode pour gérer le token (exemple d'utilisation de stockage local)
  storeToken(token: string): void {
    localStorage.setItem('token', token); // Stocke dans localStorage
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}
