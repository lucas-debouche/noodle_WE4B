import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UesService } from '../../../services/ues.service';
import { UserService } from '../../../services/user.service';
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
    private router: Router, // ✨ AJOUT DU ROUTER
    private route: ActivatedRoute,
    private uesService: UesService,
    private utilisateurService: UserService,
    private departementService: DepartementService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();

    // ✨ GESTION AMÉLIORÉE DES PARAMÈTRES DE ROUTE
    this.route.params.subscribe(params => {
      const ueId = params['id'];
      console.log('🔍 ID récupéré via params subscription:', ueId);

      if (ueId && ueId !== 'undefined' && ueId.trim() !== '') {
        this.loadUeForEdit(ueId);
      } else {
        // Réinitialiser le mode création si pas d'ID valide
        this.exitEditMode();
      }
    });
  }

  // ✨ NOUVELLE MÉTHODE : Charger UE pour édition
// Dans ue-registration.component.ts, remplacer loadUeForEdit par :

  private async loadUeForEdit(ueId: string) {
    console.log('🔄 ========== DÉBUT loadUeForEdit ==========');
    console.log('🔄 ID reçu:', ueId, 'Type:', typeof ueId);

    this.loading = true;
    this.error = '';

    try {
      console.log('🌐 Appel API getUeById...');
      const response: any = await this.uesService.getUeById(ueId).toPromise();

      console.log('📥 Réponse complète du service:', response);
      console.log('📥 Type de la réponse:', typeof response);
      console.log('📥 Clés de la réponse:', response ? Object.keys(response) : 'null');

      // ✨ GESTION ROBUSTE DE LA RÉPONSE
      let ue: any = null;

      if (response) {
        // Cas 1: Réponse directe avec l'UE
        if (response._id || response.id) {
          ue = response;
          console.log('✅ UE trouvée directement dans la réponse');
        }
        // Cas 2: Réponse encapsulée avec success/data
        else if (response.success && response.data) {
          ue = response.data;
          console.log('✅ UE trouvée dans response.data');
        }
        // Cas 3: Réponse encapsulée avec ue
        else if (response.ue) {
          ue = response.ue;
          console.log('✅ UE trouvée dans response.ue');
        }
        else {
          console.log('⚠️ Structure de réponse inattendue:', response);
        }
      }

      // ✨ VALIDATION DE L'UE RÉCUPÉRÉE
      if (ue && (ue._id || ue.id)) {
        const ueId = ue._id || ue.id;

        console.log('✅ UE valide trouvée:', {
          id: ueId,
          code: ue.code,
          intitule: ue.intitule,
          participants: ue.participants?.length || 0,
          structure: Object.keys(ue)
        });

        // ✨ NORMALISER LA STRUCTURE DE L'UE
        const normalizedUe: Ue = {
          _id: ueId,
          code: ue.code,
          intitule: ue.intitule,
          description: ue.description,
          ects: ue.ects,
          image: ue.image,
          departementId: ue.departementId,
          departementNom: ue.departementNom,
          participants: ue.participants || [],
          createdAt: ue.createdAt,
          updatedAt: ue.updatedAt
        };

        console.log('🔄 UE normalisée:', normalizedUe);

        // ✨ MISE À JOUR DE L'ÉTAT AVEC FORÇAGE DE CHANGEMENT
        console.log('🔄 État AVANT mise à jour:', {
          isEditMode: this.isEditMode,
          editingUe: this.editingUe?._id
        });

        // Réinitialiser d'abord
        this.editingUe = null;
        this.isEditMode = false;

        // Puis définir les nouvelles valeurs
        setTimeout(() => {
          this.isEditMode = true;
          this.editingUe = normalizedUe;

          console.log('🔄 État APRÈS mise à jour:', {
            isEditMode: this.isEditMode,
            editingUe: this.editingUe?._id,
            editingUeCode: this.editingUe?.code
          });
        }, 0);

      } else {
        console.error('❌ UE invalide ou manquante:', {
          ue: ue,
          hasId: !!(ue?._id || ue?.id),
          response: response
        });
        throw new Error('UE non trouvée - données invalides');
      }

    } catch (error: any) {
      console.error('❌ Erreur chargement UE:', error);
      this.error = `Impossible de charger l'UE pour modification: ${error?.message || 'Erreur inconnue'}`;
      this.exitEditMode();

   } finally {
      this.loading = false;
      console.log('🔄 ========== FIN loadUeForEdit ==========');
    }
  }
  async loadInitialData() {
    this.loading = true;
    try {
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

  async onUeCreated(ue: Ue) {
    console.log('🎉 UE créée, actualisation des données...');
    this.success = 'UE créée avec succès !';
    this.clearMessages();
    await this.refreshUesList();
  }

  async onUeUpdated(updatedUe: any) {
    console.log('🔄 onUeUpdated appelé avec:', updatedUe);

    if (!updatedUe._id) {
      console.error('❌ UE mise à jour sans ID:', updatedUe);
      this.error = 'Erreur: UE mise à jour sans ID';
      return;
    }

    // Mettre à jour la liste locale
    this.ues = this.ues.map((ue) => (ue._id === updatedUe._id ? updatedUe : ue));

    this.success = 'UE mise à jour avec succès';
    this.clearMessages();

    // ✨ SORTIR DU MODE ÉDITION ET REDIRIGER
    this.exitEditMode();

    // Actualiser la liste
    await this.refreshUesList();
  }

  async onUeDeleted(deletedUe: Ue) {
    this.ues = this.ues.filter(ue => ue._id !== deletedUe._id);
    this.success = 'UE supprimée avec succès !';

    if (this.editingUe?._id === deletedUe._id) {
      this.exitEditMode();
      this.router.navigate(['/admin/ue-registration'], { replaceUrl: true });
    }

    this.clearMessages();
  }

  onFormError(error: string) {
    this.error = error;
    this.clearMessages();
  }

  // ✨ CORRECTION : Gestion du mode édition avec navigation
  onEditUe(ue: Ue) {
    console.log('✏️ ========== onEditUe APPELÉ ==========');
    console.log('✏️ UE reçue:', ue);
    console.log('📝 ID de l\'UE:', ue._id);

    // Vérifier que l'ID existe
    if (!ue._id) {
      console.error('❌ Aucun ID trouvé dans l\'UE:', ue);
      this.error = 'Erreur: ID d\'UE manquant';
      return;
    }

    console.log('🔄 Navigation vers édition UE:', ue._id);
    this.router.navigate(['/admin/ue-registration', ue._id]);
    console.log('✏️ ========== Fin onEditUe ==========');
  }

  onCancelEdit() {
    console.log('❌ Annulation édition');
    this.exitEditMode();

  }

  private exitEditMode() {
    this.isEditMode = false;
    this.editingUe = null;
    console.log('🚪 Mode édition quitté');
  }

  private clearMessages() {
    setTimeout(() => {
      this.error = '';
      this.success = '';
    }, 5000);
  }

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

  async onRefreshData() {
    console.log('🔄 Actualisation complète des données...');
    await this.loadInitialData();
  }
}
