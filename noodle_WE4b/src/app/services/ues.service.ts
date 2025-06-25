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

  getUes(): Observable<Ue[]> {
    return this.getAllUes();
  }

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

  createUe(ueData: FormData): Observable<Ue> {
    console.log('🚀 UesService.createUe appelé avec FormData');
    console.log('📤 Données envoyées:', this.logFormData(ueData));

    return this.http.post<CreateUeResponse>(`${this.apiUrl}`, ueData)
      .pipe(
        map(response => {
          console.log('✅ Réponse createUe:', response);
          if (response.success && response.ue) return response.ue;
          throw new Error(response.message || 'Erreur lors de la création de l\'UE');
        }),
        catchError(this.handleError)
      );
  }

  updateUe(id: string, ueData: FormData): Observable<Ue> {
    console.log('🔄 UesService.updateUe appelé pour ID:', id);
    console.log('📤 Données envoyées:', this.logFormData(ueData));

    return this.http.put<UpdateUeResponse>(`${this.apiUrl}/${id}`, ueData)
      .pipe(
        map(response => {
          console.log('✅ Réponse updateUe:', response);
          if (response.success && response.ue) return response.ue;
          throw new Error(response.message || 'Erreur lors de la mise à jour de l\'UE');
        }),
        catchError(this.handleError)
      );
  }

  deleteUe(id: string): Observable<void> {
    console.log('🗑️ UesService.deleteUe appelé pour ID:', id);

    return this.http.delete<{ success: boolean, message: string }>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          console.log('✅ Réponse deleteUe:', response);
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la suppression de l\'UE');
          }
        }),
        catchError(this.handleError)
      );

  }

  // ===============================
  // MÉTHODES DE RECHERCHE
  // ===============================

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

  getParticipantsByUe(ueId: string): Observable<any[]> {
    console.log('👥 UesService.getParticipantsByUe appelé pour UE:', ueId);

    return this.http.get<any>(`${this.apiUrl}/${ueId}/participants`)
      .pipe(
        map(response => {
          console.log('✅ Réponse getParticipantsByUe brute:', response);
          if (Array.isArray(response)) return response;
          if (response?.success && Array.isArray(response.data)) return response.data;
          if (response?.participants && Array.isArray(response.participants)) return response.participants;
          return [];
        }),
        catchError(this.handleError)
      );
  }

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

  createUeWithJSON(ueData: any): Observable<Ue> {
    console.log('🚀 UesService.createUeWithJSON appelé');

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<CreateUeResponse>(`${this.apiUrl}`, ueData, { headers })
      .pipe(
        map(response => {
          console.log('✅ Réponse createUeWithJSON:', response);
          if (response.success && response.ue) return response.ue;
          throw new Error(response.message || 'Erreur lors de la création de l\'UE');
        }),
        catchError(this.handleError)
      );
  }

  updateUeWithJSON(id: string, ueData: any): Observable<Ue> {
    console.log('🔄 UesService.updateUeWithJSON appelé');

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.put<UpdateUeResponse>(`${this.apiUrl}/${id}`, ueData, { headers })
      .pipe(
        map(response => {
          console.log('✅ Réponse updateUeWithJSON:', response);
          if (response.success && response.ue) return response.ue;
          throw new Error(response.message || 'Erreur lors de la mise à jour');
        }),
        catchError(this.handleError)
      );
  }

  // ===============================
  // UTILITAIRES
  // ===============================

  private logFormData(formData: FormData): any {
    const obj: any = {};
    formData.forEach((value, key) => {
      obj[key] = value instanceof File ? `[File: ${value.name}, ${value.size} bytes]` : value;
    });
    return obj;
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur inconnue s\'est produite';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.statusText}`;
    }

    console.error('🔴 Erreur HTTP:', error);
    return throwError(() => new Error(errorMessage));
  };

  validateUeData(ueData: any): string[] {
    const errors: string[] = [];
    if (!ueData.code || !ueData.code.trim()) errors.push('Le code UE est requis');
    if (!ueData.intitule || !ueData.intitule.trim()) errors.push('L\'intitulé est requis');
    if (!ueData.ects || ueData.ects < 1 || ueData.ects > 30) errors.push('Les ECTS doivent être entre 1 et 30');
    return errors;
  }

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
    updatedAt: Date | undefined;
  } {
    return {
      id: ue._id,
      code: ue.code,
      intitule: ue.intitule,
      image: ue.image ? this.getImageUrl(ue.image) : undefined,
      description: ue.description,
      ects: ue.ects,
      participants: ue.participants || [],
      departementId: ue.departementId,
      departementNom: ue.departementNom,
      createdAt: ue.createdAt ? new Date(ue.createdAt) : undefined,
      updatedAt: ue.updatedAt ? new Date(ue.updatedAt) : undefined
    };
  }

  private getImageUrl(image: string): string {
    return image.startsWith('http') ? image : `http://localhost:3000${image}`;
  }
  removeUserFromUe(ueId: string, userId: string): Observable<any> {
    console.log(`🗑️ UesService.removeUserFromUe appelé pour UE: ${ueId}, utilisateur: ${userId}`);
    return this.http.delete(`${this.apiUrl}/${ueId}/participants/${userId}`);
  }

}

