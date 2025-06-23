import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {map, Observable, throwError} from 'rxjs';
import { Ue } from '../models/ue.model';
import {catchError} from "rxjs/operators";

@Injectable({
  providedIn: 'root',
})
export class UesService {
  private apiUrl = 'http://localhost:3000/api/ue';

  constructor(private http: HttpClient) {}

  // Récupérer la liste des UEs
  getUes(): Observable<Ue[]> {
    return this.http.get<Ue[]>(this.apiUrl);
  }

  /**
   * Récupère les informations détaillées d'une UE
   * @param ueId - Identifiant de l'UE
   * @returns Observable<Ue>
   */
  /**
   * Récupère les informations détaillées d'une UE
   * @param ueId - Identifiant de l'UE
   * @returns Observable<Ue>
   */
  getUeById(ueId: string): Observable<Ue> {
    // CORRECTION FINALE: /api/ue/:ueId (pas de double "ue")
    const url = `${this.apiUrl}/${ueId}`;

    console.log('🌐 Appel API vers:', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // Ajoutez vos headers d'authentification si nécessaire
      // 'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        console.log('📥 Réponse UE brute:', response);

        // Adapter la réponse selon le format de votre API
        if (response.success) {
          return this.formatUe(response.data || response.ue);
        } else if (response.id || response._id) {
          return this.formatUe(response);
        } else {
          return this.formatUe(response.ue || response);
        }
      }),
      catchError(error => {
        console.error('❌ Erreur lors du chargement de l\'UE:', error);
        console.error('🔗 URL appelée:', url);
        return throwError(() => new Error(
          error.error?.message ||
          `Erreur lors du chargement de l'UE ${ueId}`
        ));
      })
    );
  }

  /**
   * Récupère les participants d'une UE
   * @param ueId - Identifiant de l'UE
   * @returns Observable<any[]>
   */
  getParticipantsByUe(ueId: string): Observable<any[]> {
    const url = `${this.apiUrl}/${ueId}/participants`;

    console.log('🌐 Appel API participants vers:', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        console.log('📥 Réponse participants brute:', response);

        // Adapter la réponse selon le format de votre API
        if (response.success && response.data) {
          console.log('✅ Format API avec success:', response.data.length, 'participants');
          return response.data;
        } else if (Array.isArray(response)) {
          console.log('✅ Format API tableau direct:', response.length, 'participants');
          return response;
        } else if (response.participants) {
          console.log('✅ Format API avec participants:', response.participants.length, 'participants');
          return response.participants;
        } else {
          console.log('⚠️ Format API non reconnu, structure:', Object.keys(response));
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Erreur lors du chargement des participants:', error);
        console.error('🔗 URL appelée:', url);
        return throwError(() => new Error(
          error.error?.message ||
          `Erreur lors du chargement des participants de l'UE ${ueId}`
        ));
      })
    );
  }

  /**
   * Récupère toutes les UEs
   * @returns Observable<Ue[]>
   */
  getAllUes(): Observable<Ue[]> {
    const url = `${this.apiUrl}/ues`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        const ues = response.data || response.ues || response;
        return Array.isArray(ues) ? ues.map(ue => this.formatUe(ue)) : [];
      }),
      catchError(error => {
        console.error('Erreur lors du chargement des UEs:', error);
        return throwError(() => new Error(
          error.error?.message ||
          'Erreur lors du chargement de la liste des UEs'
        ));
      })
    );
  }

  /**
   * Crée une nouvelle UE
   * @param ueData - Données de l'UE à créer
   * @returns Observable<Ue>
   */
  createUe(ueData: {
    code: string;
    intitule: string;
    description?: string;
    ects: number;
    image?: string;
  }): Observable<Ue> {
    const url = `${this.apiUrl}/ues`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(url, ueData, { headers }).pipe(
      map(response => {
        const ue = response.data || response.ue || response;
        return this.formatUe(ue);
      }),
      catchError(error => {
        console.error('Erreur lors de la création de l\'UE:', error);
        return throwError(() => new Error(
          error.error?.message ||
          'Erreur lors de la création de l\'UE'
        ));
      })
    );
  }

  /**
   * Met à jour une UE existante
   * @param ueId - Identifiant de l'UE
   * @param ueData - Nouvelles données de l'UE
   * @returns Observable<Ue>
   */
  updateUe(ueId: string, ueData: Partial<{
    code: string;
    intitule: string;
    description?: string;
    ects: number;
    image?: string;
  }>): Observable<Ue> {
    const url = `${this.apiUrl}/ues/${ueId}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<any>(url, ueData, { headers }).pipe(
      map(response => {
        const ue = response.data || response.ue || response;
        return this.formatUe(ue);
      }),
      catchError(error => {
        console.error('Erreur lors de la mise à jour de l\'UE:', error);
        return throwError(() => new Error(
          error.error?.message ||
          'Erreur lors de la mise à jour de l\'UE'
        ));
      })
    );
  }

  /**
   * Supprime une UE
   * @param ueId - Identifiant de l'UE
   * @returns Observable<any>
   */
  deleteUe(ueId: string): Observable<any> {
    const url = `${this.apiUrl}/ues/${ueId}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.delete<any>(url, { headers }).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression de l\'UE:', error);
        return throwError(() => new Error(
          error.error?.message ||
          'Erreur lors de la suppression de l\'UE'
        ));
      })
    );
  }

  /**
   * Recherche des UEs par critères
   * @param searchTerm - Terme de recherche
   * @returns Observable<Ue[]>
   */
  searchUes(searchTerm: string): Observable<Ue[]> {
    const url = `${this.apiUrl}/ues/search?q=${encodeURIComponent(searchTerm)}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        const ues = response.data || response.ues || response;
        return Array.isArray(ues) ? ues.map(ue => this.formatUe(ue)) : [];
      }),
      catchError(error => {
        console.error('Erreur lors de la recherche d\'UEs:', error);
        return throwError(() => new Error(
          error.error?.message ||
          'Erreur lors de la recherche d\'UEs'
        ));
      })
    );
  }

  /**
   * Formate et normalise les données d'une UE selon votre interface
   * @param ue - Données brutes de l'UE
   * @returns Ue - UE formatée selon votre interface
   */
  private formatUe(ue: any): Ue {
    if (!ue) {
      throw new Error('Données UE invalides');
    }

    return {
      id: ue.id || ue._id,
      code: ue.code || ue.codeUE || '',
      intitule: ue.intitule || ue.nom || ue.name || ue.titre || '',
      image: ue.image || ue.imageUrl || ue.photo,
      description: ue.description || ue.desc,
      ects: ue.ects || ue.credits || ue.creditsECTS || 0,
      participants: ue.participants || ue.participantIds || ue.inscrits || []
    };
  }


}
