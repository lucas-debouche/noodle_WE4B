import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-participants-filters',
  templateUrl: './participants-filters.component.html',
  styleUrls: ['./participants-filters.component.scss']
})
export class ParticipantsFiltersComponent {
  @Input() searchTerm: string = '';
  @Input() roleFilter: string = 'tous';
  @Input() sortBy: string = 'nom';
  @Input() showFilters: boolean = false;
  @Input() selectedPromotion: string = 'toutes';
  @Input() selectedStatut: string = 'tous';
  @Input() promotions: string[] = [];
  @Input() totalVisibleParticipants: number = 0;
  @Input() totalParticipants: number = 0;

  @Output() searchChange = new EventEmitter<string>();
  @Output() roleFilterChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() toggleFiltersChange = new EventEmitter<void>();
  @Output() promotionChange = new EventEmitter<string>();
  @Output() statutChange = new EventEmitter<string>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() exportParticipants = new EventEmitter<void>();

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

  onSearchChange() {
    this.searchChange.emit(this.searchTerm);
  }

  onRoleFilterChange() {
    this.roleFilterChange.emit(this.roleFilter);
  }

  onSortChange() {
    this.sortChange.emit(this.sortBy);
  }

  onPromotionChange() {
    this.promotionChange.emit(this.selectedPromotion);
  }

  onStatutChange() {
    this.statutChange.emit(this.selectedStatut);
  }

  toggleFilters() {
    this.toggleFiltersChange.emit();
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchChange.emit(this.searchTerm);
  }

  onResetFilters() {
    this.resetFilters.emit();
  }

  onExportParticipants() {
    this.exportParticipants.emit();
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm !== '' ||
      this.roleFilter !== 'tous' ||
      this.selectedPromotion !== 'toutes' ||
      this.selectedStatut !== 'tous';
  }
}
