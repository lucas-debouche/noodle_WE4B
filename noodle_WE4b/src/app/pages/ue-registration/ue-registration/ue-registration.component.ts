import { Component, OnInit } from '@angular/core';
import { UesService } from '../../../services/ues.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { DepartementService } from '../../../services/departement.service';
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
    private utilisateurService: UtilisateurService,
    private departementService: DepartementService
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
        this.departementService.getAllDepartements().toPromise()
      ]);

      this.ues = ues || [];
      this.users = users || [];
      this.departements = departements || [];

      console.log('🏢 Départements chargés:', this.departements);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      this.error = 'Erreur lors du chargement des données';

      // Fallback en cas d'erreur avec l'API départements
      if (!this.departements || this.departements.length === 0) {
        console.log('📦 Utilisation des départements par défaut');
        this.departements = this.getDefaultDepartements();
      }
    } finally {
      this.loading = false;
    }
  }

  private getDefaultDepartements(): Departement[] {
    return [
      {
        id: 'default-1',
        nom: 'Informatique',
        description: 'Département informatique',
        code: 'INFO',
        actif: true
      },
      {
        id: 'default-2',
        nom: 'Mathématiques',
        description: 'Département mathématiques',
        code: 'MATH',
        actif: true
      },
      {
        id: 'default-3',
        nom: 'Physique',
        description: 'Département physique',
        code: 'PHYS',
        actif: true
      }
    ];
  }

  // ✅ CORRECTION: Actualisation après création
  async onUeCreated(ue: Ue) {
    console.log('🎉 UE créée, actualisation des données...');
    this.success = 'UE créée avec succès !';
    this.clearMessages();

    // Recharger toutes les UEs pour avoir la liste à jour
    await this.refreshUesList();
  }


  async onUeUpdated(updatedUe: Ue) {
    console.log('🔄 UE mise à jour, actualisation des données...');
    this.success = 'UE mise à jour avec succès !';
    this.exitEditMode();
    this.clearMessages();

    // Recharger toutes les UEs pour avoir la liste à jour
    await this.refreshUesList();
  }

  async onUeDeleted(deletedUe: Ue) {
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

  // ✅ NOUVELLE MÉTHODE: Actualiser uniquement les UEs
  private async refreshUesList() {
    try {
      console.log('🔄 Actualisation de la liste des UEs...');
      const ues = await this.uesService.getAllUes().toPromise();
      this.ues = ues || [];
      console.log('✅ Liste des UEs actualisée:', this.ues.length, 'UEs');
    } catch (error) {
      console.error('❌ Erreur lors de l\'actualisation des UEs:', error);
    }
  }

  // Méthodes utilitaires
  async onRefreshData() {
    console.log('🔄 Actualisation complète des données...');
    await this.loadInitialData();
  }
}
