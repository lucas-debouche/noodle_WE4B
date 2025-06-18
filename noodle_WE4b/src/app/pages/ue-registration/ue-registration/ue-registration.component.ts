import { Component, OnInit } from '@angular/core';
import { UesService } from '../../../services/ues.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { Ue } from '../../../models/ue.model';
import { User } from '../../../models/user.model';
import { Departement } from '../../../models/departement.model';

@Component({
  selector: 'app-ue-registration',
  templateUrl: './ue-registration.component.html',
  styleUrls: ['./ue-registration.component.scss']
})
export class UeRegistrationComponent implements OnInit {
  ues: Ue[] = [];
  users: User[] = [];
  departements: Departement[] = [];

  // États
  loading = false;
  error = '';
  success = '';

  // Mode édition
  isEditMode = false;
  editingUe: Ue | null = null;

  constructor(
    private uesService: UesService,
    private utilisateurService: UtilisateurService
  ) {}

  ngOnInit() {
    this.loadInitialData();
  }

  async loadInitialData() {
    this.loading = true;
    try {
      // Charger en parallèle les UEs, utilisateurs et départements
      const [ues, users, departements] = await Promise.all([
        this.uesService.getAllUes().toPromise(),
        this.utilisateurService.getUtilisateurs().toPromise(),
        this.loadDepartements()
      ]);

      this.ues = ues || [];
      this.users = users || [];
      this.departements = departements || [];

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      this.error = 'Erreur lors du chargement des données';
    } finally {
      this.loading = false;
    }
  }

  private async loadDepartements(): Promise<Departement[]> {
    // Mock data - à remplacer par un service réel
    return [
      { id: '1', nom: 'Informatique', description: 'Département informatique' },
      { id: '2', nom: 'Mathématiques', description: 'Département mathématiques' },
      { id: '3', nom: 'Physique', description: 'Département physique' }
    ];
  }

  // Gestion des événements du formulaire
  onUeCreated(ue: Ue) {
    this.ues.push(ue);
    this.success = 'UE créée avec succès !';
    this.clearMessages();
  }

  onUeUpdated(updatedUe: Ue) {
    const index = this.ues.findIndex(ue => ue.id === updatedUe.id);
    if (index !== -1) {
      this.ues[index] = updatedUe;
    }
    this.success = 'UE mise à jour avec succès !';
    this.exitEditMode();
    this.clearMessages();
  }

  onUeDeleted(deletedUe: Ue) {
    this.ues = this.ues.filter(ue => ue.id !== deletedUe.id);
    this.success = 'UE supprimée avec succès !';
    if (this.editingUe?.id === deletedUe.id) {
      this.exitEditMode();
    }
    this.clearMessages();
  }

  onFormError(error: string) {
    this.error = error;
    this.clearMessages();
  }

  // Gestion du mode édition
  onEditUe(ue: Ue) {
    this.isEditMode = true;
    this.editingUe = ue;
    this.clearMessages();
  }

  onCancelEdit() {
    this.exitEditMode();
  }

  private exitEditMode() {
    this.isEditMode = false;
    this.editingUe = null;
  }

  private clearMessages() {
    setTimeout(() => {
      this.error = '';
      this.success = '';
    }, 5000);
  }

  // Méthodes utilitaires
  onRefreshData() {
    this.loadInitialData();
  }
}
