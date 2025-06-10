import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UtilisateurService {
  private apiUrl = 'http://localhost:3000/api/utilisateur';

  constructor(private http: HttpClient) {}

  // Obtenir tous les utilisateurs
  getUtilisateurs(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // Récupérer l'utilisateur actuel
  getUtilisateurActuel(): Observable<User> {
    return this.http.get<User>('http://localhost:3000/api/utilisateur/current');
  }

  // Mettre à jour un utilisateur
  updateUtilisateur(formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, formData); // Modifiez l'URL si nécessaire
  }

}
