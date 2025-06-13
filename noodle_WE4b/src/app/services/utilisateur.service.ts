import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

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
    return this.http.get<User>(`${this.apiUrl}/current`);
  }
  getUtilisateurById(userId: string): Observable<any> {
    return this.http.get(`http://localhost:3000/api/utilisateur/${userId}`);
  }

  // Mettre à jour un utilisateur
  updateUtilisateur(formData: FormData, nom: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update_photo/${nom}`, formData); // Modifiez l'URL si nécessaire
  }

}
