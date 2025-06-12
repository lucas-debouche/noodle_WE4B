import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, throwError} from 'rxjs';

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
        localStorage.setItem('token', response.token);
      })
    );
  }

  // Méthode pour l'inscription utilisateur
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token'); // Vérifie si un token est présent
    return !!token; // Retourne true si le token existe
  }
}
