import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UesService } from '../../../../../services/ues.service';
import { Ue } from '../../../../../models/ue.model';

@Component({
  selector: 'app-ue-list',
  templateUrl: './ue-list.component.html',
  styleUrls: ['./ue-list.component.scss']
})
export class UeListComponent {
  @Input() ues: Ue[] = [];
  @Input() editingUeId: string | undefined;

  @Output() editUe = new EventEmitter<Ue>();
  @Output() deleteUe = new EventEmitter<Ue>();
  @Output() refreshData = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  filteredUes: Ue[] = [];
  searchTerm = '';

  constructor(private uesService: UesService) {}

  ngOnChanges() {
    this.filteredUes = [...this.ues];
    this.onSearchChange();
  }

  onSearchChange() {
    if (!this.searchTerm.trim()) {
      this.filteredUes = [...this.ues];
      return;
    }

    const search = this.searchTerm.toLowerCase();
    this.filteredUes = this.ues.filter(ue =>
      ue.code.toLowerCase().includes(search) ||
      ue.intitule.toLowerCase().includes(search) ||
      (ue.description && ue.description.toLowerCase().includes(search))
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.onSearchChange();
  }

  onEditUe(ue: Ue) {
    this.editUe.emit(ue);
  }

  async onDeleteUe(ue: Ue) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'UE "${ue.code} - ${ue.intitule}" ?`)) {
      return;
    }

    try {
      await this.uesService.deleteUe(ue._id).toPromise();
      this.deleteUe.emit(ue);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      this.error.emit('Erreur lors de la suppression de l\'UE');
    }
  }

  onRefresh() {
    this.refreshData.emit();
  }

  trackByUeId(index: number, ue: Ue): string {
    return ue._id;
  }

  isEditing(ue: Ue): boolean {
    return this.editingUeId === ue._id;
  }
}
