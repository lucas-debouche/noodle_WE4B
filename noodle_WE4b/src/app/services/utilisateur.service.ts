import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {map, Observable, throwError} from 'rxjs';
import { User } from '../models/user.model';
import {catchError} from "rxjs/operators";
import {ParticipantWithUeInfo} from "../models/participant-ue.model";

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
  /**
   * Récupère tous les participants (étudiants et professeurs) d'une UE
   * @param ueId - Identifiant de l'UE
   * @returns Observable<ParticipantWithUeInfo[]>
   */
  getParticipantsByUe(ueId: string): Observable<ParticipantWithUeInfo[]> {
    const url = `${this.apiUrl}/ue/${ueId}/participants`;

    console.log('🌐 Appel API vers:', url);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // Ajoutez vos headers d'authentification si nécessaire
      // 'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        console.log('📥 Réponse brute de l\'API:', response);

        // Adapter la réponse selon le format de votre API
        let participants = [];

        if (response.success && response.data) {
          participants = response.data;
          console.log('✅ Format API avec success:', participants.length, 'participants');
        } else if (Array.isArray(response)) {
          participants = response;
          console.log('✅ Format API tableau direct:', participants.length, 'participants');
        } else if (response.participants) {
          participants = response.participants;
          console.log('✅ Format API avec participants:', participants.length, 'participants');
        } else {
          console.log('⚠️ Format API non reconnu, structure:', Object.keys(response));
          participants = [];
        }

        const formattedParticipants = this.formatParticipants(participants);
        console.log('🔄 Participants formatés:', formattedParticipants);

        return formattedParticipants;
      }),
      catchError(error => {
        console.error('❌ Erreur HTTP détaillée:', error);
        console.error('📊 Status:', error.status);
        console.error('📝 Message:', error.message);
        console.error('🔗 URL:', url);

        if (error.status === 404) {
          console.error('🚫 Endpoint non trouvé - Vérifiez que la route existe côté backend');
        } else if (error.status === 0) {
          console.error('🌐 Erreur de connexion - Vérifiez que le serveur backend est démarré');
        }

        return throwError(() => new Error(
          error.error?.message ||
          `Erreur ${error.status}: ${error.message}` ||
          'Erreur lors du chargement des participants de l\'UE'
        ));
      })
    );
  }

  /**
   * Récupère les étudiants d'une UE spécifique
   * @param ueId - Identifiant de l'UE
   * @returns Observable<ParticipantWithUeInfo[]>
   */
  getEtudiantsByUe(ueId: string): Observable<ParticipantWithUeInfo[]> {
    const url = `${this.apiUrl}/ues/${ueId}/etudiants`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        const etudiants = response.data || response.etudiants || response;
        return this.formatParticipants(etudiants).filter(p =>
          this.isEtudiant(p.role)
        );
      }),
      catchError(error => {
        console.error('Erreur lors du chargement des étudiants:', error);
        return throwError(() => new Error(
          error.error?.message ||
          'Erreur lors du chargement des étudiants de l\'UE'
        ));
      })
    );
  }

  /**
   * Récupère les professeurs d'une UE spécifique
   * @param ueId - Identifiant de l'UE
   * @returns Observable<ParticipantWithUeInfo[]>
   */
  getProfesseursByUe(ueId: string): Observable<ParticipantWithUeInfo[]> {
    const url = `${this.apiUrl}/ues/${ueId}/professeurs`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        const professeurs = response.data || response.professeurs || response;
        return this.formatParticipants(professeurs).filter(p =>
          this.isProfesseur(p.role)
        );
      }),
      catchError(error => {
        console.error('Erreur lors du chargement des professeurs:', error);
        return throwError(() => new Error(
          error.error?.message ||
          'Erreur lors du chargement des professeurs de l\'UE'
        ));
      })
    );
  }

  /**
   * Inscrire un utilisateur à une UE
   * @param ueId - Identifiant de l'UE
   * @param utilisateurId - Identifiant de l'utilisateur
   * @param metadata - Métadonnées d'inscription (promotion, spécialité, etc.)
   * @returns Observable<any>
   */
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

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      utilisateurId: utilisateurId,
      ...metadata
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'inscription:', error);
        return throwError(() => new Error(
          error.error?.message ||
          'Erreur lors de l\'inscription à l\'UE'
        ));
      })
    );
  }

  /**
   * Désinscrire un utilisateur d'une UE
   * @param ueId - Identifiant de l'UE
   * @param utilisateurId - Identifiant de l'utilisateur
   * @returns Observable<any>
   */
  desinscrireUtilisateurUe(ueId: string, utilisateurId: string): Observable<any> {
    const url = `${this.apiUrl}/ues/${ueId}/participants/${utilisateurId}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.delete<any>(url, { headers }).pipe(
      catchError(error => {
        console.error('Erreur lors de la désinscription:', error);
        return throwError(() => new Error(
          error.error?.message ||
          'Erreur lors de la désinscription de l\'UE'
        ));
      })
    );
  }

  // Récupérer tous les utilisateurs assignés à une UE
  getUtilisateursByUe(ueId: string) {
    return this.http.get<User[]>(`${this.apiUrl}/ue/${ueId}`);
  }

  /**
   * Rechercher des participants dans une UE
   * @param ueId - Identifiant de l'UE
   * @param searchTerm - Terme de recherche
   * @param filters - Filtres additionnels
   * @returns Observable<ParticipantWithUeInfo[]>
   */
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
      if (filters.roleType) {
        url += `&roleType=${filters.roleType}`;
      }
      if (filters.promotion) {
        url += `&promotion=${encodeURIComponent(filters.promotion)}`;
      }
      if (filters.statut) {
        url += `&statut=${filters.statut}`;
      }
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        const participants = response.data || response.participants || response;
        return this.formatParticipants(participants);
      }),
      catchError(error => {
        console.error('Erreur lors de la recherche:', error);
        return throwError(() => new Error(
          error.error?.message ||
          'Erreur lors de la recherche de participants'
        ));
      })
    );
  }

  /**
   * Exporter les participants d'une UE en CSV
   * @param ueId - Identifiant de l'UE
   * @returns Observable<Blob>
   */
  exportParticipantsCSV(ueId: string): Observable<Blob> {
    const url = `${this.apiUrl}/ue/${ueId}/participants/export`;

    const headers = new HttpHeaders({
      'Accept': 'text/csv'
    });

    return this.http.get(url, {
      headers,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'export:', error);
        return throwError(() => new Error(
          'Erreur lors de l\'export des participants'
        ));
      })
    );
  }

  /**
   * Récupère les statistiques des participants d'une UE
   * @param ueId - Identifiant de l'UE
   * @returns Observable<any>
   */
  getParticipantsStats(ueId: string): Observable<any> {
    const url = `${this.apiUrl}/ues/${ueId}/participants/stats`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => response.data || response),
      catchError(error => {
        console.error('Erreur lors du chargement des statistiques:', error);
        return throwError(() => new Error(
          'Erreur lors du chargement des statistiques'
        ));
      })
    );
  }

  /**
   * Met à jour les métadonnées d'un participant dans une UE
   * @param ueId - Identifiant de l'UE
   * @param utilisateurId - Identifiant de l'utilisateur
   * @param metadata - Nouvelles métadonnées
   * @returns Observable<any>
   */
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

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<any>(url, metadata, { headers }).pipe(
      catchError(error => {
        console.error('Erreur lors de la mise à jour:', error);
        return throwError(() => new Error(
          'Erreur lors de la mise à jour des informations du participant'
        ));
      })
    );
  }

  // Méthodes utilitaires

  /**
   * Vérifie si un utilisateur est étudiant
   * @param roles - Tableau des rôles
   * @returns boolean
   */
  private isEtudiant(roles: string[]): boolean {
    // Dans votre système, les étudiants ont le rôle ROLE_USER
    return roles.includes('ROLE_USER') && !roles.includes('ROLE_PROF') && !roles.includes('ROLE_ADMIN');
  }

  /**
   * Vérifie si un utilisateur est professeur
   * @param roles - Tableau des rôles
   * @returns boolean
   */
  private isProfesseur(roles: string[]): boolean {
    // Dans votre système, les professeurs ont le rôle ROLE_PROF
    return roles.includes('ROLE_PROF');
  }

  /**
   * Détermine le type de rôle principal d'un utilisateur
   * @param roles - Tableau des rôles
   * @returns 'etudiant' | 'professeur' | 'admin' | 'autre'
   */
  getRoleType(roles: string[]): 'etudiant' | 'professeur' | 'admin' | 'autre' {
    if (roles.includes('ROLE_ADMIN')) return 'admin';
    if (roles.includes('ROLE_PROF')) return 'professeur';
    if (roles.includes('ROLE_USER') && !roles.includes('ROLE_PROF') && !roles.includes('ROLE_ADMIN')) return 'etudiant';
    return 'autre';
  }

  /**
   * Formate et normalise les données des participants
   * @param participants - Données brutes des participants
   * @returns ParticipantWithUeInfo[] - Participants formatés
   */
  private formatParticipants(participants: any[]): ParticipantWithUeInfo[] {
    if (!Array.isArray(participants)) {
      return [];
    }

    return participants.map(participant => ({
      // Propriétés de base de User
      _id: participant._id || '',
      nom: participant.nom || participant.lastName || participant.name || '',
      prenom: participant.prenom || participant.firstName || '',
      email: participant.email || '',
      photo: participant.photo || participant.avatar,
      role: Array.isArray(participant.role) ? participant.role :
        participant.roles ? participant.roles :
          participant.role ? [participant.role] : ['ROLE_USER'],
      ues: participant.ues || participant.ueIds || [],

      // Métadonnées spécifiques à l'UE
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
