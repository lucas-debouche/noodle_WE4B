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
  getUeById(ueId: string): Observable<Ue> {
    const url = `${this.apiUrl}/${ueId}`;

    console.log('🌐 Appel API vers:', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
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
    const url = `${this.apiUrl}`;

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
    image?: File | null;
    departementId?: string;
    assignedUsers?: string[];
  }): Observable<Ue> {
    const url = `${this.apiUrl}`;

    // Préparer FormData pour l'upload de fichier
    const formData = new FormData();
    formData.append('code', ueData.code);
    formData.append('intitule', ueData.intitule);
    formData.append('ects', ueData.ects.toString());

    if (ueData.description) {
      formData.append('description', ueData.description);
    }

    if (ueData.departementId) {
      formData.append('departement', ueData.departementId);
    }

    if (ueData.image) {
      formData.append('image', ueData.image);
    }

    if (ueData.assignedUsers && ueData.assignedUsers.length > 0) {
      ueData.assignedUsers.forEach(userId => {
        formData.append('assigned_users[]', userId);
      });
    }

    // Ajouter le token CSRF si nécessaire
    // formData.append('_token', this.getCsrfToken());

    return this.http.post<any>(url, formData).pipe(
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
  updateUe(ueId: string, ueData: {
    code?: string;
    intitule?: string;
    description?: string;
    ects?: number;
    image?: File | null;
    departementId?: string;
    assignedUsers?: string[];
  }): Observable<Ue> {
    const url = `${this.apiUrl}/${ueId}`;

    // Préparer FormData pour l'upload de fichier
    const formData = new FormData();

    if (ueData.code !== undefined) {
      formData.append('code', ueData.code);
    }

    if (ueData.intitule !== undefined) {
      formData.append('intitule', ueData.intitule);
    }

    if (ueData.ects !== undefined) {
      formData.append('ects', ueData.ects.toString());
    }

    if (ueData.description !== undefined) {
      formData.append('description', ueData.description);
    }

    if (ueData.departementId !== undefined) {
      formData.append('departement', ueData.departementId);
    }

    if (ueData.image) {
      formData.append('image', ueData.image);
    }

    if (ueData.assignedUsers && ueData.assignedUsers.length > 0) {
      ueData.assignedUsers.forEach(userId => {
        formData.append('assigned_users[]', userId);
      });
    }

    return this.http.put<any>(url, formData).pipe(
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
    const url = `${this.apiUrl}/${ueId}`;

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
    const url = `${this.apiUrl}/search?q=${encodeURIComponent(searchTerm)}`;

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
   * Ajouter un participant à une UE
   * @param ueId - Identifiant de l'UE
   * @param utilisateurId - Identifiant de l'utilisateur
   * @param metadata - Métadonnées d'inscription
   * @returns Observable<any>
   */
  addParticipantToUe(
      ueId: string,
      utilisateurId: string,
      metadata?: {
        promotion?: string;
        specialite?: string;
        statut?: 'actif' | 'inactif';
      }
  ): Observable<any> {
    const url = `${this.apiUrl}/${ueId}/participants`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      utilisateurId: utilisateurId,
      ...metadata
    };

    return this.http.post<any>(url, body, { headers }).pipe(
        catchError(error => {
          console.error('Erreur lors de l\'ajout du participant:', error);
          return throwError(() => new Error(
              error.error?.message ||
              'Erreur lors de l\'ajout du participant à l\'UE'
          ));
        })
    );
  }

  /**
   * Retirer un participant d'une UE
   * @param ueId - Identifiant de l'UE
   * @param utilisateurId - Identifiant de l'utilisateur
   * @returns Observable<any>
   */
  removeParticipantFromUe(ueId: string, utilisateurId: string): Observable<any> {
    const url = `${this.apiUrl}/${ueId}/participants/${utilisateurId}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.delete<any>(url, { headers }).pipe(
        catchError(error => {
          console.error('Erreur lors du retrait du participant:', error);
          return throwError(() => new Error(
              error.error?.message ||
              'Erreur lors du retrait du participant de l\'UE'
          ));
        })
    );
  }

  /**
   * Upload d'une photo pour une UE
   * @param ueCode - Code de l'UE
   * @param image - Fichier image
   * @returns Observable<any>
   */
  uploadUePhoto(ueCode: string, image: File): Observable<any> {
    const url = `${this.apiUrl}/${ueCode}/upload-photo`;

    const formData = new FormData();
    formData.append('image', image);

    return this.http.post<any>(url, formData).pipe(
        catchError(error => {
          console.error('Erreur lors de l\'upload de l\'image:', error);
          return throwError(() => new Error(
              error.error?.message ||
              'Erreur lors de l\'upload de l\'image'
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
      participants: ue.participants || ue.participantIds || ue.inscrits || [],
      departementId: ue.departement_id || ue.departementId,
      departementNom: ue.departement_nom || ue.departementNom,
      createdAt: ue.createdAt || ue.created_at,
      updatedAt: ue.updatedAt || ue.updated_at
    };
  }
}
