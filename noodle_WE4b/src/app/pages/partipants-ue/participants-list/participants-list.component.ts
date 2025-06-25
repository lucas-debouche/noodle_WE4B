import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { UesService } from '../../../services/ues.service';
import { Ue } from "../../../models/ue.model";
import { ParticipantWithUeInfo } from "../../../models/participant-ue.model";

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
  roleFilter: string = 'tous';
  sortBy: string = 'nom';
  showFilters: boolean = false;
  selectedPromotion: string = 'toutes';
  selectedStatut: string = 'tous';

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
      }
    );
  }

  processParticipants(participants: ParticipantWithUeInfo[]) {
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

  // Gestionnaires d'événements des filtres
  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.applyFiltersAndSort();
  }

  onRoleFilterChange(roleFilter: string) {
    this.roleFilter = roleFilter;
    this.applyFiltersAndSort();
  }

  onSortChange(sortBy: string) {
    this.sortBy = sortBy;
    this.applyFiltersAndSort();
  }

  onPromotionChange(promotion: string) {
    this.selectedPromotion = promotion;
    this.applyFiltersAndSort();
  }

  onStatutChange(statut: string) {
    this.selectedStatut = statut;
    this.applyFiltersAndSort();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
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

  hasActiveFilters(): boolean {
    return this.searchTerm !== '' ||
      this.roleFilter !== 'tous' ||
      this.selectedPromotion !== 'toutes' ||
      this.selectedStatut !== 'tous';
  }

  refreshData() {
    this.loadData();
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

  // Méthodes utilitaires pour les rôles
  private isEtudiant(roles: string[]): boolean {
    return roles.includes('ROLE_USER') && !roles.includes('ROLE_PROF') && !roles.includes('ROLE_ADMIN');
  }

  private isProfesseur(roles: string[]): boolean {
    return roles.includes('ROLE_PROF');
  }
}
