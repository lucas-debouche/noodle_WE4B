import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Ue } from '../models/ue.model';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  ue?: T;
  message?: string;
  error?: string;
}

export interface CreateUeResponse {
  success: boolean;
  message: string;
  ue: Ue;
}

export interface UpdateUeResponse {
  success: boolean;
  message: string;
  ue: Ue;
}

@Injectable({
  providedIn: 'root'
})
export class UesService {
  private apiUrl = 'http://localhost:3000/api/ue';

  constructor(private http: HttpClient) {}

  // ===============================
  // MÉTHODES CRUD PRINCIPALES
  // ===============================

  /**
   * Récupérer toutes les UEs
   */
  getAllUes(): Observable<Ue[]> {
    console.log('🔍 UesService.getAllUes appelé');

    return this.http.get<Ue[]>(`${this.apiUrl}`)
      .pipe(
        map(response => {
          console.log('✅ Réponse getAllUes:', response);
          return Array.isArray(response) ? response : [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Alias pour getAllUes() pour compatibilité avec l'ancien code
   */
  getUes(): Observable<Ue[]> {
    return this.getAllUes();
  }

  /**
   * Récupérer une UE par ID
   */
  getUeById(id: string): Observable<Ue> {
    console.log('🔍 UesService.getUeById appelé pour ID:', id);

    return this.http.get<Ue>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          console.log('✅ Réponse getUeById:', response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Créer une nouvelle UE avec FormData (pour upload de fichiers)
   */
  createUe(ueData: FormData): Observable<Ue> {
    console.log('🚀 UesService.createUe appelé avec FormData');
    console.log('📤 Données envoyées:', this.logFormData(ueData));

    // ✅ IMPORTANT: Ne pas définir Content-Type pour FormData
    // Le navigateur le fera automatiquement avec la boundary correcte
    return this.http.post<CreateUeResponse>(`${this.apiUrl}`, ueData)
      .pipe(
        map(response => {
          console.log('✅ Réponse createUe:', response);
          if (response.success && response.ue) {
            return response.ue;
          } else {
            throw new Error(response.message || 'Erreur lors de la création de l\'UE');
          }
        }),
        catchError((error) => {
          console.error('❌ Erreur lors de la création de l\'UE:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Mettre à jour une UE avec FormData
   */
  updateUe(id: string, ueData: FormData): Observable<Ue> {
    console.log('🔄 UesService.updateUe appelé pour ID:', id);
    console.log('📤 Données envoyées:', this.logFormData(ueData));

    return this.http.put<UpdateUeResponse>(`${this.apiUrl}/${id}`, ueData)
      .pipe(
        map(response => {
          console.log('✅ Réponse updateUe:', response);
          if (response.success && response.ue) {
            return response.ue;
          } else {
            throw new Error(response.message || 'Erreur lors de la mise à jour de l\'UE');
          }
        }),
        catchError((error) => {
          console.error('❌ Erreur lors de la mise à jour de l\'UE:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Supprimer une UE
   */
  deleteUe(id: string): Observable<void> {
    console.log('🗑️ UesService.deleteUe appelé pour ID:', id);

    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          console.log('✅ Réponse deleteUe:', response);
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la suppression de l\'UE');
          }
        }),
        catchError((error) => {
          console.error('❌ Erreur lors de la suppression de l\'UE:', error);
          console.log('🔗 URL appelée:', `${this.apiUrl}/${id}`);
          console.log('📊 Status:', error.status);
          console.log('📄 Response:', error.error);
          return this.handleError(error);
        })
      );
  }

  // ===============================
  // MÉTHODES DE RECHERCHE
  // ===============================

  /**
   * Rechercher des UEs
   */
  searchUes(query: string): Observable<Ue[]> {
    console.log('🔍 UesService.searchUes appelé avec query:', query);

    if (!query.trim()) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    return this.http.get<Ue[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`)
      .pipe(
        map(response => {
          console.log('✅ Réponse searchUes:', response);
          return Array.isArray(response) ? response : [];
        }),
        catchError(this.handleError)
      );
  }

  // ===============================
  // GESTION DES PARTICIPANTS
  // ===============================

  /**
   * Récupérer les participants d'une UE
   */
  getParticipantsByUe(ueId: string): Observable<any[]> {
    console.log('👥 UesService.getParticipantsByUe appelé pour UE:', ueId);

    return this.http.get<any>(`${this.apiUrl}/${ueId}/participants`)
      .pipe(
        map(response => {
          console.log('✅ Réponse getParticipantsByUe brute:', response);

          // ✅ CORRECTION: Gestion de différents formats de réponse
          if (Array.isArray(response)) {
            console.log('📋 Format tableau direct');
            return response;
          } else if (response && response.success && Array.isArray(response.data)) {
            console.log('📋 Format avec success et data');
            return response.data;
          } else if (response && Array.isArray(response.data)) {
            console.log('📋 Format avec data seulement');
            return response.data;
          } else if (response && response.participants && Array.isArray(response.participants)) {
            console.log('📋 Format avec participants');
            return response.participants;
          } else {
            console.log('⚠️ Format de réponse non reconnu, retour tableau vide');
            return [];
          }
        }),
        catchError((error) => {
          console.error('❌ Erreur lors de la récupération des participants:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Ajouter un participant à une UE
   */
  addParticipantToUe(ueId: string, participantData: any): Observable<any> {
    console.log('➕ UesService.addParticipantToUe appelé');

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${ueId}/participants`, participantData)
      .pipe(
        map(response => {
          console.log('✅ Réponse addParticipantToUe:', response);
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Retirer un participant d'une UE
   */
  removeParticipantFromUe(ueId: string, participantId: string): Observable<void> {
    console.log('➖ UesService.removeParticipantFromUe appelé');

    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${ueId}/participants/${participantId}`)
      .pipe(
        map(response => {
          console.log('✅ Réponse removeParticipantFromUe:', response);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les statistiques des participants d'une UE
   */
  getParticipantsStats(ueId: string): Observable<any> {
    console.log('📊 UesService.getParticipantsStats appelé pour UE:', ueId);

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${ueId}/participants/stats`)
      .pipe(
        map(response => {
          console.log('✅ Réponse getParticipantsStats:', response);
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  // ===============================
  // MÉTHODES ALTERNATIVES (JSON)
  // ===============================

  /**
   * Créer une UE avec JSON (sans fichier)
   */
  createUeWithJSON(ueData: any): Observable<Ue> {
    console.log('🚀 UesService.createUeWithJSON appelé');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<CreateUeResponse>(`${this.apiUrl}`, ueData, { headers })
      .pipe(
        map(response => {
          console.log('✅ Réponse createUeWithJSON:', response);
          if (response.success && response.ue) {
            return response.ue;
          } else {
            throw new Error(response.message || 'Erreur lors de la création de l\'UE');
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour une UE avec JSON (sans fichier)
   */
  updateUeWithJSON(id: string, ueData: any): Observable<Ue> {
    console.log('🔄 UesService.updateUeWithJSON appelé');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<UpdateUeResponse>(`${this.apiUrl}/${id}`, ueData, { headers })
      .pipe(
        map(response => {
          console.log('✅ Réponse updateUeWithJSON:', response);
          if (response.success && response.ue) {
            return response.ue;
          } else {
            throw new Error(response.message || 'Erreur lors de la mise à jour de l\'UE');
          }
        }),
        catchError(this.handleError)
      );
  }

  // ===============================
  // MÉTHODES UTILITAIRES
  // ===============================

  /**
   * Logger le contenu d'un FormData pour debug
   */
  private logFormData(formData: FormData): any {
    const obj: any = {};
    formData.forEach((value, key) => {
      if (value instanceof File) {
        obj[key] = `[File: ${value.name}, ${value.size} bytes]`;
      } else {
        obj[key] = value;
      }
    });
    return obj;
  }

  /**
   * Gestionnaire d'erreur centralisé
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur inconnue s\'est produite';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    console.error('🔴 Erreur HTTP:', error);
    console.error('📝 Message d\'erreur:', errorMessage);

    return throwError(() => new Error(errorMessage));
  };

  // ===============================
  // MÉTHODES DE VALIDATION
  // ===============================

  /**
   * Valider les données d'une UE avant envoi
   */
  validateUeData(ueData: any): string[] {
    const errors: string[] = [];

    if (!ueData.code || !ueData.code.trim()) {
      errors.push('Le code UE est requis');
    }

    if (!ueData.intitule || !ueData.intitule.trim()) {
      errors.push('L\'intitulé est requis');
    }

    if (!ueData.ects || ueData.ects < 1 || ueData.ects > 30) {
      errors.push('Les ECTS doivent être entre 1 et 30');
    }

    return errors;
  }

  /**
   * Formater les données d'UE pour l'affichage
   */
  formatUeForDisplay(ue: Ue): {
    id: string;
    code: string | undefined;
    intitule: string;
    image?: string;
    description?: string;
    ects: number;
    participants?: string[];
    departementId?: string;
    departementNom?: string;
    createdAt: Date | undefined;
    updatedAt: Date | undefined
  } {
    return {
      ...ue,
      code: ue.code?.toUpperCase(),
      createdAt: ue.createdAt ? new Date(ue.createdAt) : undefined,
      updatedAt: ue.updatedAt ? new Date(ue.updatedAt) : undefined
    };
  }
}
