import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { UesService } from '../../../services/ues.service';
import {Ue} from "../../../models/ue.model";
import {ParticipantWithUeInfo} from "../../../models/participant-ue.model";


@Component({
  selector: 'app-participants-list',
  templateUrl: './participants-list.component.html',
  styleUrls: ['./participants-list.component.scss']
})
export class ParticipantsListComponent implements OnInit {
  ueInfo: Ue | null = null;
  etudiants: ParticipantWithUeInfo[] = [];
  professeurs: ParticipantWithUeInfo[] = [];
  filteredEtudiants: ParticipantWithUeInfo[] = [];
  filteredProfesseurs: ParticipantWithUeInfo[] = [];

  loading: boolean = false;
  error: string = '';

  // Filtres et recherche
  searchTerm: string = '';
  roleFilter: string = 'tous'; // 'tous', 'etudiants', 'professeurs'
  sortBy: string = 'nom'; // 'nom', 'prenom', 'recent', 'promotion'
  showFilters: boolean = false;
  selectedPromotion: string = 'toutes';
  selectedStatut: string = 'tous';

  // Options pour les filtres
  roleOptions = [
    { value: 'tous', label: 'Tous les participants', icon: '👥' },
    { value: 'etudiants', label: 'Étudiants uniquement', icon: '🎓' },
    { value: 'professeurs', label: 'Professeurs uniquement', icon: '👨‍🏫' }
  ];

  sortOptions = [
    { value: 'nom', label: 'Nom (A-Z)' },
    { value: 'prenom', label: 'Prénom (A-Z)' },
    { value: 'recent', label: 'Plus récents' },
    { value: 'promotion', label: 'Par promotion' }
  ];

  statutOptions = [
    { value: 'tous', label: 'Tous les statuts' },
    { value: 'actif', label: 'Actifs uniquement' },
    { value: 'inactif', label: 'Inactifs uniquement' }
  ];

  // Listes pour les filtres
  promotions: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private utilisateurService: UtilisateurService,
    private ueService: UesService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const ueId = this.route.snapshot.paramMap.get('ueId');
    if (ueId) {
      this.loading = true;
      this.error = '';

      // Charger les informations de l'UE
      this.loadUeInfo(ueId);

      // Charger les participants
      this.loadParticipants(ueId);
    } else {
      this.error = 'Identifiant UE manquant';
    }
  }

  loadUeInfo(ueId: string) {
    this.ueService.getUeById(ueId).subscribe(
      (ue: Ue) => {
        this.ueInfo = ue;
        console.log('UE chargée:', ue);
      },
      error => {
        console.error('Erreur lors du chargement de l\'UE:', error);
      }
    );
  }

  loadParticipants(ueId: string) {
    console.log('🔍 Chargement des participants pour UE:', ueId);

    // CORRECTION: Utiliser ueService au lieu de utilisateurService
    this.ueService.getParticipantsByUe(ueId).subscribe(
      data => {
        console.log('✅ Données reçues de l\'API:', data);
        console.log('📊 Nombre de participants:', data ? data.length : 0);

        if (data && data.length > 0) {
          this.processParticipants(data);
          this.extractPromotions();
          this.applyFiltersAndSort();
        } else {
          console.log('⚠️ Aucun participant trouvé');
          this.etudiants = [];
          this.professeurs = [];
          this.filteredEtudiants = [];
          this.filteredProfesseurs = [];
        }

        this.loading = false;
      },
      error => {
        console.error('❌ Erreur lors du chargement des participants:', error);
        this.error = 'Erreur lors du chargement des participants: ' + (error.message || error);
        this.loading = false;

        // Debug: vérifier si l'endpoint existe
        console.log('🔗 URL appelée:', `http://localhost:3000/api/ue/${ueId}/participants`);
      }
    );
  }

  // Méthode utilitaire pour obtenir l'URL de l'API (à adapter selon votre configuration)
  private getApiUrl(): string {
    // Remplacez par votre URL d'API
    return 'http://localhost:3000/api';
  }

  processParticipants(participants: ParticipantWithUeInfo[]) {
    // Debug: afficher les participants reçus
    console.log('Participants reçus:', participants);
    console.log('Premier participant (exemple):', participants[0]);

    this.etudiants = participants
      .filter(p => {
        const isEtudiant = this.isEtudiant(p.role);
        console.log(`${p.prenom} ${p.nom} - Rôles: ${p.role.join(', ')} - Est étudiant: ${isEtudiant}`);
        return isEtudiant;
      })
      .map(p => ({
        ...p,
        statut: p.statut || 'actif'
      }));

    this.professeurs = participants
      .filter(p => {
        const isProfesseur = this.isProfesseur(p.role);
        console.log(`${p.prenom} ${p.nom} - Rôles: ${p.role.join(', ')} - Est professeur: ${isProfesseur}`);
        return isProfesseur;
      })
      .map(p => ({
        ...p,
        statut: p.statut || 'actif'
      }));

    console.log('Étudiants filtrés:', this.etudiants);
    console.log('Professeurs filtrés:', this.professeurs);
  }

  extractPromotions() {
    const promotionsSet = new Set<string>();
    this.etudiants.forEach(etudiant => {
      if (etudiant.promotion) {
        promotionsSet.add(etudiant.promotion);
      }
    });
    this.promotions = Array.from(promotionsSet).sort();
  }

  applyFiltersAndSort() {
    // Filtrer les étudiants
    this.filteredEtudiants = this.filterParticipants(this.etudiants);

    // Filtrer les professeurs
    this.filteredProfesseurs = this.filterParticipants(this.professeurs);

    // Appliquer le tri
    this.filteredEtudiants = this.sortParticipants(this.filteredEtudiants);
    this.filteredProfesseurs = this.sortParticipants(this.filteredProfesseurs);
  }

  filterParticipants(participants: ParticipantWithUeInfo[]): ParticipantWithUeInfo[] {
    let filtered = [...participants];

    // Filtre par terme de recherche
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(search) ||
        p.prenom.toLowerCase().includes(search) ||
        p.email.toLowerCase().includes(search) ||
        (p.promotion && p.promotion.toLowerCase().includes(search)) ||
        (p.specialite && p.specialite.toLowerCase().includes(search))
      );
    }

    // Filtre par promotion (seulement pour les étudiants)
    if (this.selectedPromotion !== 'toutes' && participants.length > 0 && this.isEtudiant(participants[0].role)) {
      filtered = filtered.filter(p => p.promotion === this.selectedPromotion);
    }

    // Filtre par statut
    if (this.selectedStatut !== 'tous') {
      filtered = filtered.filter(p => p.statut === this.selectedStatut);
    }

    return filtered;
  }

  sortParticipants(participants: ParticipantWithUeInfo[]): ParticipantWithUeInfo[] {
    return participants.sort((a, b) => {
      switch (this.sortBy) {
        case 'nom':
          return a.nom.localeCompare(b.nom);
        case 'prenom':
          return a.prenom.localeCompare(b.prenom);
        case 'recent':
          if (a.dateInscription && b.dateInscription) {
            return new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime();
          }
          return a.nom.localeCompare(b.nom);
        case 'promotion':
          if (a.promotion && b.promotion) {
            return a.promotion.localeCompare(b.promotion);
          }
          return a.nom.localeCompare(b.nom);
        default:
          return a.nom.localeCompare(b.nom);
      }
    });
  }

  // Méthodes pour les filtres
  onSearchChange() {
    this.applyFiltersAndSort();
  }

  onRoleFilterChange() {
    this.applyFiltersAndSort();
  }

  onSortChange() {
    this.applyFiltersAndSort();
  }

  onPromotionChange() {
    this.applyFiltersAndSort();
  }

  onStatutChange() {
    this.applyFiltersAndSort();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFiltersAndSort();
  }

  resetFilters() {
    this.searchTerm = '';
    this.roleFilter = 'tous';
    this.sortBy = 'nom';
    this.selectedPromotion = 'toutes';
    this.selectedStatut = 'tous';
    this.applyFiltersAndSort();
  }

  // Méthodes utilitaires
  getVisibleEtudiants(): ParticipantWithUeInfo[] {
    return this.roleFilter === 'professeurs' ? [] : this.filteredEtudiants;
  }

  getVisibleProfesseurs(): ParticipantWithUeInfo[] {
    return this.roleFilter === 'etudiants' ? [] : this.filteredProfesseurs;
  }

  getTotalVisibleParticipants(): number {
    return this.getVisibleEtudiants().length + this.getVisibleProfesseurs().length;
  }

  getTotalParticipants(): number {
    return this.etudiants.length + this.professeurs.length;
  }

  refreshData() {
    this.loadData();
  }

  getInitials(participant: ParticipantWithUeInfo): string {
    return `${participant.prenom.charAt(0)}${participant.nom.charAt(0)}`.toUpperCase();
  }

  getParticipantBadgeColor(participant: ParticipantWithUeInfo): string {
    if (this.isProfesseur(participant.role)) {
      return 'professor';
    }

    if (participant.statut === 'inactif') {
      return 'inactive';
    }

    // Couleur basée sur la promotion pour les étudiants
    if (participant.promotion) {
      const promotions = ['L1', 'L2', 'L3', 'M1', 'M2'];
      const index = promotions.indexOf(participant.promotion);
      return index !== -1 ? `promotion-${index}` : 'default';
    }

    return 'default';
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  exportParticipants() {
    const ueId = this.route.snapshot.paramMap.get('ueId');
    if (!ueId) return;

    this.utilisateurService.exportParticipantsCSV(ueId).subscribe(
      (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `participants_${this.ueInfo?.code || 'ue'}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        console.error('Erreur lors de l\'export:', error);
      }
    );
  }

  trackByParticipantId(index: number, participant: ParticipantWithUeInfo): string {
    return participant.id;
  }

  // Méthodes utilitaires pour les rôles

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
   * Obtient le libellé du rôle principal
   * @param roles - Tableau des rôles
   * @returns string
   */
  getRoleLabel(roles: string[]): string {
    const roleType = this.getRoleType(roles);
    switch (roleType) {
      case 'etudiant':
        return 'Étudiant';
      case 'professeur':
        return 'Professeur';
      case 'admin':
        return 'Administrateur';
      default:
        return 'Autre';
    }
  }

  /**
   * Obtient l'icône du rôle principal
   * @param roles - Tableau des rôles
   * @returns string
   */
  getRoleIcon(roles: string[]): string {
    const roleType = this.getRoleType(roles);
    switch (roleType) {
      case 'etudiant':
        return '🎓';
      case 'professeur':
        return '👨‍🏫';
      case 'admin':
        return '👑';
      default:
        return '👤';
    }
  }

  /**
   * Obtient le temps relatif depuis une date
   * @param date - Date au format string
   * @returns string
   */
  getRelativeTime(date: string): string {
    if (!date) return '';

    const now = new Date();
    const targetDate = new Date(date);
    const diffInMs = now.getTime() - targetDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes <= 1 ? 'À l\'instant' : `Il y a ${diffInMinutes} min`;
      }
      return `Il y a ${diffInHours}h`;
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jours`;
    } else if (diffInDays < 30) {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
    } else if (diffInDays < 365) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `Il y a ${diffInMonths} mois`;
    } else {
      return targetDate.toLocaleDateString('fr-FR');
    }
  }


  /**
   * Construit l'URL complète de la photo
   */
  getPhotoUrl(photo: string, participant: ParticipantWithUeInfo): string {
    if (!photo || photo === 'null') {
      return '';
    }

    if (photo.startsWith('http')) {
      return photo;
    }

    if (photo.startsWith('/uploads')) {
      return `http://localhost:3000${photo}`;
    }

    // Construire le chemin basé sur la structure: /uploads/user/{nom}/photo_profil/{filename}
    return `http://localhost:3000/uploads/user/${participant.nom}/photo_profil/${photo}`;
  }

  /**
   * Gère les erreurs de chargement d'image
   */
  onImageError(event: any, participant: ParticipantWithUeInfo) {
    console.log(`❌ Erreur chargement image pour ${participant.prenom} ${participant.nom}:`, participant.photo);

    // Cacher l'image et afficher les initiales
    event.target.style.display = 'none';


  }

}
