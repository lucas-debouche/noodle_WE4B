import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FormControl, ValidationErrors } from '@angular/forms';
import { User } from '../models/user.model';
import { ParticipantWithUeInfo } from '../models/participant-ue.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/utilisateur';

  constructor(private http: HttpClient) {}

  // --- Gestion Utilisateur de base ---
  createUser(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  updateUser(userId: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}`, formData);
  }

  getUser(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`);
  }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/role');
  }

  getDepartements(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/ue');
  }

  // --- Méthodes avancées issues de UtilisateurService ---
  getUtilisateurs(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUtilisateurActuel(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/current`);
  }

  getUtilisateurById(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`);
  }

  updateUtilisateur(formData: FormData, nom: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update_photo/${nom}`, formData);
  }

  getParticipantsByUe(ueId: string): Observable<ParticipantWithUeInfo[]> {
    const url = `${this.apiUrl}/ue/${ueId}/participants`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        let participants = [];
        if (response.success && response.data) {
          participants = response.data;
        } else if (Array.isArray(response)) {
          participants = response;
        } else if (response.participants) {
          participants = response.participants;
        } else {
          participants = [];
        }
        return this.formatParticipants(participants);
      }),
      catchError(error => throwError(() => new Error(
        error.error?.message ||
        `Erreur ${error.status}: ${error.message}` ||
        'Erreur lors du chargement des participants de l\'UE'
      )))
    );
  }

  getUesByUserId(userId: string): Observable<any[]> {
    const url = `${this.apiUrl}/${userId}/ue`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<any>(url, { headers }).pipe(
      map(response => response.data || response.ues || []),
      catchError(error => throwError(() => new Error(
        error.error?.message ||
        'Erreur lors du chargement des UEs de l\'utilisateur'
      )))
    );
  }

  getProfesseursByUe(ueId: string): Observable<ParticipantWithUeInfo[]> {
    const url = `${this.apiUrl}/ues/${ueId}/professeurs`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        const professeurs = response.data || response.professeurs || response;
        return this.formatParticipants(professeurs).filter(p =>
          this.isProfesseur(p.role)
        );
      }),
      catchError(error => throwError(() => new Error(
        error.error?.message ||
        'Erreur lors du chargement des professeurs de l\'UE'
      )))
    );
  }

  inscrireUtilisateurUe(
    ueId: string,
    utilisateurId: string,
    metadata?: {
      promotion?: string;
      specialite?: string;
      statut?: 'actif' | 'inactif';
    }
  ): Observable<any> {
    const url = `${this.apiUrl}/ues/${ueId}/participants`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { utilisateurId, ...metadata };
    return this.http.post<any>(url, body, { headers }).pipe(
      catchError(error => throwError(() => new Error(
        error.error?.message ||
        'Erreur lors de l\'inscription à l\'UE'
      )))
    );
  }

  desinscrireUtilisateurUe(ueId: string, utilisateurId: string): Observable<any> {
    const url = `${this.apiUrl}/ues/${ueId}/participants/${utilisateurId}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.delete<any>(url, { headers }).pipe(
      catchError(error => throwError(() => new Error(
        error.error?.message ||
        'Erreur lors de la désinscription de l\'UE'
      )))
    );
  }

  getUtilisateursByUe(ueId: string) {
    return this.http.get<User[]>(`${this.apiUrl}/ue/${ueId}`);
  }

  searchParticipantsInUe(
    ueId: string,
    searchTerm: string,
    filters?: {
      roleType?: 'etudiant' | 'professeur';
      promotion?: string;
      statut?: 'actif' | 'inactif';
    }
  ): Observable<ParticipantWithUeInfo[]> {
    let url = `${this.apiUrl}/ues/${ueId}/participants/search?q=${encodeURIComponent(searchTerm)}`;
    if (filters) {
      if (filters.roleType) url += `&roleType=${filters.roleType}`;
      if (filters.promotion) url += `&promotion=${encodeURIComponent(filters.promotion)}`;
      if (filters.statut) url += `&statut=${filters.statut}`;
    }
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        const participants = response.data || response.participants || response;
        return this.formatParticipants(participants);
      }),
      catchError(error => throwError(() => new Error(
        error.error?.message ||
        'Erreur lors de la recherche de participants'
      )))
    );
  }

  exportParticipantsCSV(ueId: string): Observable<Blob> {
    const url = `${this.apiUrl}/ue/${ueId}/participants/export`;
    const headers = new HttpHeaders({ 'Accept': 'text/csv' });
    return this.http.get(url, { headers, responseType: 'blob' }).pipe(
      catchError(error => throwError(() => new Error(
        'Erreur lors de l\'export des participants'
      )))
    );
  }

  getParticipantsStats(ueId: string): Observable<any> {
    const url = `${this.apiUrl}/ues/${ueId}/participants/stats`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<any>(url, { headers }).pipe(
      map(response => response.data || response),
      catchError(error => throwError(() => new Error(
        'Erreur lors du chargement des statistiques'
      )))
    );
  }

  updateParticipantMetadata(
    ueId: string,
    utilisateurId: string,
    metadata: {
      promotion?: string;
      specialite?: string;
      statut?: 'actif' | 'inactif';
      noteFinale?: number;
      presence?: number;
    }
  ): Observable<any> {
    const url = `${this.apiUrl}/ues/${ueId}/participants/${utilisateurId}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<any>(url, metadata, { headers }).pipe(
      catchError(error => throwError(() => new Error(
        'Erreur lors de la mise à jour des informations du participant'
      )))
    );
  }

  // --- Utilitaires et helpers ---
  prepareFormData(formValue: any, photoFile?: File | null | undefined): FormData {
    const formData = new FormData();
    Object.entries(formValue).forEach(([key, value]) => {
      if (key === 'roles' && Array.isArray(value)) {
        (value as string[]).forEach((role: string) =>
          formData.append('roles[]', role)
        );
      } else if (key === 'ues' && Array.isArray(value)) {
        (value as string[]).forEach((ue: string) =>
          formData.append('ues[]', ue)
        );
      } else if (key !== 'photo' && value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });
    if (photoFile) {
      formData.append('photo', photoFile);
    }
    return formData;
  }

  isStepCompleted(step: number, formValue: any, hasPhoto: boolean = false): boolean {
    switch (step) {
      case 1:
        return !!(formValue.nom && formValue.prenom);
      case 2:
        return !!(formValue.email && formValue.plainPassword);
      case 3:
        return true; // Photo optionnelle
      case 4:
        return !!(formValue.roles && formValue.roles.length > 0);
      default:
        return false;
    }
  }

  getCurrentStep(formValue: any): number {
    if (!formValue.nom || !formValue.prenom) {
      return 1;
    }
    if (!formValue.email || !formValue.plainPassword) {
      return 2;
    }
    if (!formValue.roles || formValue.roles.length === 0) {
      return 4;
    }
    return 4;
  }

  markAllFieldsAsTouched(formGroup: any): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  // --- Méthodes utilitaires pour participants ---
  private isEtudiant(roles: string[]): boolean {
    return roles.includes('ROLE_USER') && !roles.includes('ROLE_PROF') && !roles.includes('ROLE_ADMIN');
  }

  private isProfesseur(roles: string[]): boolean {
    return roles.includes('ROLE_PROF');
  }

  getRoleType(roles: string[]): 'etudiant' | 'professeur' | 'admin' | 'autre' {
    if (roles.includes('ROLE_ADMIN')) return 'admin';
    if (roles.includes('ROLE_PROF')) return 'professeur';
    if (roles.includes('ROLE_USER') && !roles.includes('ROLE_PROF') && !roles.includes('ROLE_ADMIN')) return 'etudiant';
    return 'autre';
  }

  private formatParticipants(participants: any[]): ParticipantWithUeInfo[] {
    if (!Array.isArray(participants)) {
      return [];
    }
    return participants.map(participant => ({
      _id: participant._id || '',
      nom: participant.nom || participant.lastName || participant.name || '',
      prenom: participant.prenom || participant.firstName || '',
      email: participant.email || '',
      photo: participant.photo || participant.avatar,
      role: Array.isArray(participant.role) ? participant.role :
        participant.roles ? participant.roles :
          participant.role ? [participant.role] : ['ROLE_USER'],
      ues: participant.ues || participant.ueIds || [],
      dateInscription: participant.dateInscription || participant.createdAt || participant.inscriptionDate,
      statut: participant.statut || participant.status || 'actif',
      promotion: participant.promotion || participant.class || participant.niveau,
      specialite: participant.specialite || participant.speciality || participant.filiere,
      telephone: participant.telephone || participant.phone,
      dateNaissance: participant.dateNaissance || participant.birthDate,
      adresse: participant.adresse || participant.address,
      noteFinale: participant.noteFinale || participant.finalGrade,
      presence: participant.presence || participant.attendanceRate
    }));
  }
}

/**
 * Fonction de validation de mot de passe
 */
export function passwordValidator(control: FormControl): ValidationErrors | null {
  const errors: any = {};
  const value = control.value || '';

  if (value.length < 10) errors['minLength'] = true;
  if ((value.match(/[A-Z]/g) || []).length < 2) errors['uppercase'] = true;
  if (!/\d/.test(value)) errors['number'] = true;
  if ((value.match(/[!@#$%^&*()_+\-=\[\]{} ':"\\|,.<>\/?]/g) || []).length < 2) errors['specialChars'] = true;

  return Object.keys(errors).length ? errors : null;
}
