import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, AfterViewInit, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../../../models/user.model'
import { UesService } from '../../../../../services/ues.service';
import { Ue } from  '../../../../../models/ue.model';
import { Departement } from '../../../../../models/departement.model';

@Component({
  selector: 'app-ue-form',
  templateUrl: './ue-form.component.html',
  styleUrls: ['./ue-form.component.scss']
})
export class UeFormComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() users: User[] = [];
  @Input() departements: Departement[] = [];
  @Input() isEditMode = false;
  @Input() editingUe: Ue | null = null;

  @Output() ueCreated = new EventEmitter<Ue>();
  @Output() ueUpdated = new EventEmitter<Ue>();
  @Output() editCancelled = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  ueForm: FormGroup = this.fb.group({});
  submitting = false;
  assignedUsers: User[] = [];
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private uesService: UesService
  ) {
    console.log('🏗️ UeFormComponent constructor appelé');
    this.initializeForm();
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit appelé:', {
      isEditMode: this.isEditMode,
      editingUe: this.editingUe?._id,
      editingUeCode: this.editingUe?.code
    });

    // ✨ VÉRIFICATION INITIALE EN CAS DE MODE ÉDITION
    if (this.isEditMode && this.editingUe && this.editingUe._id) {
      console.log('✅ Mode édition détecté dans ngOnInit, population du formulaire');
      setTimeout(() => {
        this.populateFormForEdit();
      }, 0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 ========== NgOnChanges APPELÉ ==========');
    console.log('🔄 Changes reçus:', changes);

    // Log détaillé de chaque changement
    Object.keys(changes).forEach(key => {
      const change = changes[key];
      console.log(`🔄 ${key}:`, {
        currentValue: change.currentValue,
        previousValue: change.previousValue,
        firstChange: change.firstChange
      });
    });

    // ✨ GESTION DU CHANGEMENT D'UE À ÉDITER
    if (changes['editingUe']) {
      const currentUe = changes['editingUe'].currentValue;
      const previousUe = changes['editingUe'].previousValue;

      console.log('🔄 Changement editingUe détecté:', {
        current: currentUe?._id,
        currentCode: currentUe?.code,
        previous: previousUe?._id,
        isEditMode: this.isEditMode
      });

      if (currentUe && currentUe._id && this.isEditMode) {
        console.log('✅ UE valide détectée pour édition:', currentUe._id);
        setTimeout(() => {
          this.populateFormForEdit();
        }, 0);
      } else if (!currentUe && previousUe) {
        console.log('🚪 Sortie du mode édition détectée');
        this.resetForm();
      }
    }

    // ✨ GESTION DU CHANGEMENT DE MODE ÉDITION
    if (changes['isEditMode']) {
      const currentMode = changes['isEditMode'].currentValue;
      const previousMode = changes['isEditMode'].previousValue;

      console.log('🔄 Changement de mode:', {
        previous: previousMode,
        current: currentMode,
        ue: this.editingUe?._id
      });

      if (currentMode && this.editingUe && this.editingUe._id) {
        console.log('✅ Entrée en mode édition avec UE valide');
        setTimeout(() => {
          this.populateFormForEdit();
        }, 0);
      } else if (!currentMode) {
        console.log('🚪 Sortie du mode édition');
        this.resetForm();
      }
    }

    // ✨ GESTION DES CHANGEMENTS D'UTILISATEURS
    if (changes['users'] && this.editingUe && this.editingUe._id && this.isEditMode) {
      console.log('👥 Rechargement des utilisateurs assignés après changement de liste');
      setTimeout(() => {
        this.loadAssignedUsers();
      }, 100);
    }

    console.log('🔄 ========== Fin NgOnChanges ==========');
  }

  ngAfterViewInit(): void {
    console.log('🔍 ngAfterViewInit appelé:', {
      isEditMode: this.isEditMode,
      editingUe: this.editingUe?._id,
      assignedUsers: this.assignedUsers.length
    });

    // ✨ FILET DE SÉCURITÉ : Si on est en mode édition mais qu'on n'a pas encore chargé les participants
    if (this.isEditMode && this.editingUe && this.editingUe._id && this.assignedUsers.length === 0) {
      console.log('🔄 Rechargement forcé des participants après ngAfterViewInit');
      setTimeout(() => {
        this.loadAssignedUsers();
      }, 200);
    }
  }

  private initializeForm() {
    console.log('📝 Initialisation du formulaire');
    this.ueForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{2,8}$/)]],
      intitule: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.maxLength(500)]],
      ects: ['', [Validators.required, Validators.min(1), Validators.max(30)]],
      departementId: ['']
    });
  }

  private populateFormForEdit() {
    console.log('📝 ========== populateFormForEdit APPELÉ ==========');
    console.log('📝 editingUe:', this.editingUe);
    console.log('📝 isEditMode:', this.isEditMode);

    if (!this.editingUe) {
      console.log('❌ Aucune UE à éditer (editingUe null)');
      return;
    }

    if (!this.editingUe._id) {
      console.log('❌ UE sans ID valide:', this.editingUe);
      return;
    }

    if (!this.isEditMode) {
      console.log('❌ Pas en mode édition');
      return;
    }

    console.log('✅ Population du formulaire avec UE:', {
      id: this.editingUe._id,
      code: this.editingUe.code,
      intitule: this.editingUe.intitule,
      description: this.editingUe.description,
      ects: this.editingUe.ects,
      departementId: this.editingUe.departementId
    });

    // Peupler le formulaire
    this.ueForm.patchValue({
      code: this.editingUe.code || '',
      intitule: this.editingUe.intitule || '',
      description: this.editingUe.description || '',
      ects: this.editingUe.ects || '',
      departementId: this.editingUe.departementId || ''
    });

    console.log('📝 Formulaire peuplé, valeurs:', this.ueForm.value);

    // Charger l'image si elle existe
    if (this.editingUe.image) {
      this.imagePreview = this.getImageUrl(this.editingUe.image);
      console.log('🖼️ Image preview définie:', this.imagePreview);
    } else {
      this.imagePreview = null;
      console.log('🖼️ Aucune image pour cette UE');
    }

    // Charger les utilisateurs assignés avec délai
    setTimeout(() => {
      this.loadAssignedUsers();
    }, 100);

    console.log('📝 ========== Fin populateFormForEdit ==========');
  }

  private async loadAssignedUsers() {
    console.log('👥 ========== DÉBUT loadAssignedUsers ==========');
    console.log('👥 editingUe:', this.editingUe);
    console.log('👥 editingUe?._id:', this.editingUe?._id);
    console.log('👥 isEditMode:', this.isEditMode);

    if (!this.editingUe) {
      console.log('❌ Aucune UE à éditer (editingUe null/undefined)');
      this.assignedUsers = [];
      return;
    }

    if (!this.editingUe._id) {
      console.log('❌ UE sans ID valide:', this.editingUe);
      this.assignedUsers = [];
      return;
    }

    const ueId = this.editingUe._id;
    console.log('👥 ID UE récupéré:', ueId, 'Type:', typeof ueId);

    // ✨ VALIDATION STRICTE DE L'ID
    if (!ueId || ueId === 'undefined' || ueId === 'null' || ueId.toString().trim() === '') {
      console.error('❌ ID d\'UE invalide dans loadAssignedUsers:', ueId);
      this.assignedUsers = [];
      return;
    }

    try {
      console.log('🔍 Appel API getParticipantsByUe avec ID:', ueId);

      const participants: any = await this.uesService.getParticipantsByUe(ueId).toPromise();

      console.log('📥 Participants reçus du service:', participants);

      // ✨ GESTION ROBUSTE DE LA RÉPONSE
      let participantsList: User[] = [];

      if (Array.isArray(participants)) {
        participantsList = participants as User[];
        console.log('✅ Participants sous forme de tableau direct');
      } else if (participants && typeof participants === 'object') {
        if ('data' in participants && Array.isArray(participants.data)) {
          participantsList = participants.data as User[];
          console.log('✅ Participants dans participants.data');
        } else if ('participants' in participants && Array.isArray(participants.participants)) {
          participantsList = participants.participants as User[];
          console.log('✅ Participants dans participants.participants');
        } else {
          console.log('⚠️ Format de participants inattendu, structure:', Object.keys(participants));
          participantsList = [];
        }
      } else {
        console.log('⚠️ Réponse participants non valide:', typeof participants);
        participantsList = [];
      }

      this.assignedUsers = participantsList;
      console.log('✅ Utilisateurs assignés chargés:', this.assignedUsers.length);

      if (this.assignedUsers.length > 0) {
        console.log('👥 Premier utilisateur:', this.assignedUsers[0]);
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs assignés:', error);
      this.assignedUsers = [];

      // ✨ FALLBACK : Essayer de récupérer depuis les données de l'UE
      if (this.editingUe.participants && Array.isArray(this.editingUe.participants)) {
        console.log('🔄 Tentative de fallback avec participants de l\'UE:', this.editingUe.participants);
        this.tryLoadUsersFromIds(this.editingUe.participants);
      }
    }

    console.log('👥 ========== FIN loadAssignedUsers ==========');
  }

  private async tryLoadUsersFromIds(participantIds: string[]) {
    try {
      console.log('🔍 Tentative de chargement des utilisateurs depuis les IDs:', participantIds);

      // Filtrer les utilisateurs disponibles qui correspondent aux IDs
      this.assignedUsers = this.users.filter(user =>
        participantIds.includes(user._id)
      );

      console.log('✅ Utilisateurs trouvés depuis les IDs:', this.assignedUsers.length);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs depuis les IDs:', error);
      this.assignedUsers = [];
    }
  }

  async onSubmit() {
    console.log('📤 ========== onSubmit APPELÉ ==========');

    // DEBUG: Afficher les valeurs du formulaire avant soumission
    const formValue = this.ueForm.value;
    console.log('📝 Valeurs du formulaire:', formValue);
    console.log('🏢 Département sélectionné:', formValue.departementId);
    console.log('🏢 Départements disponibles:', this.departements);
    console.log('👥 Utilisateurs assignés:', this.assignedUsers.length);

    if (this.ueForm.invalid) {
      console.log('❌ Formulaire invalide');
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;

    try {
      const formData = this.prepareFormData();

      console.log('📤 Données préparées pour envoi');

      if (this.isEditMode && this.editingUe) {
        console.log('🔄 Mode mise à jour, ID UE:', this.editingUe._id);
        const updatedUe = await this.uesService.updateUe(this.editingUe._id, formData).toPromise();
        console.log('✅ UE mise à jour:', updatedUe);
        this.ueUpdated.emit(updatedUe);
      } else {
        console.log('➕ Mode création');
        const newUe = await this.uesService.createUe(formData).toPromise();
        console.log('✅ UE créée:', newUe);
        this.ueCreated.emit(newUe);
        this.resetForm();
      }

    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      this.error.emit(error instanceof Error ? error.message : 'Erreur lors de la soumission');
    } finally {
      this.submitting = false;
      console.log('📤 ========== Fin onSubmit ==========');
    }
  }

  private prepareFormData(): FormData {
    const formValue = this.ueForm.value;
    const formData = new FormData();

    // Ajouter les champs de base
    formData.append('code', formValue.code || '');
    formData.append('intitule', formValue.intitule || '');
    formData.append('description', formValue.description || '');
    formData.append('ects', (formValue.ects || '').toString());

    // Gestion du département
    if (formValue.departementId && formValue.departementId !== '') {
      const selectedDept = this.departements.find(d => d.id === formValue.departementId);
      if (selectedDept) {
        console.log('✅ Département trouvé:', selectedDept);
        formData.append('departement', formValue.departementId);
      } else {
        console.log('⚠️ Département non trouvé, envoi sans département');
      }
    } else {
      console.log('📝 Aucun département sélectionné');
    }

    // Ajouter les utilisateurs assignés
    if (this.assignedUsers.length > 0) {
      this.assignedUsers.forEach((user, index) => {
        formData.append(`assigned_users[${index}]`, user._id);
      });
      console.log('👥 Utilisateurs assignés ajoutés:', this.assignedUsers.length);
    }

    // Ajouter l'image si sélectionnée
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
      console.log('🖼️ Image ajoutée au FormData');
    }

    return formData;
  }

  private markFormGroupTouched() {
    Object.keys(this.ueForm.controls).forEach(key => {
      const control = this.ueForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancelEdit() {
    console.log('❌ Annulation édition');
    this.resetForm();
    this.editCancelled.emit();
  }

  resetForm() {
    console.log('🔄 Réinitialisation du formulaire');
    this.ueForm.reset();
    this.assignedUsers = [];
    this.imagePreview = null;
    this.selectedFile = null;
  }

  // Gestion des utilisateurs assignés
  onUserAdded(user: User) {
    console.log('➕ Utilisateur ajouté:', user.email);
    if (!this.assignedUsers.some(assigned => assigned._id === user._id)) {
      this.assignedUsers.push(user);
      console.log('✅ Total utilisateurs assignés:', this.assignedUsers.length);
    }
  }

  onUserRemoved(user: User) {
    console.log('➖ Utilisateur retiré:', user.email);
    this.assignedUsers = this.assignedUsers.filter(assigned => assigned._id !== user._id);
    console.log('✅ Total utilisateurs assignés:', this.assignedUsers.length);
  }

  // Gestion de l'image
  onImageSelected(file: File | null) {
    this.selectedFile = file;
    console.log('🖼️ Image sélectionnée:', file?.name);
  }

  onImagePreviewChanged(preview: string | null) {
    this.imagePreview = preview;
    console.log('🖼️ Preview changée:', preview ? 'Oui' : 'Non');
  }

  // Méthodes utilitaires
  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `http://localhost:3000${imagePath}`;
  }

  getFieldError(fieldName: string): string {
    const field = this.ueForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} est requis`;
      if (field.errors['pattern']) return `${this.getFieldLabel(fieldName)} doit être en majuscules et contenir 2-8 caractères`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} doit être supérieur à ${field.errors['min'].min}`;
      if (field.errors['max']) return `${this.getFieldLabel(fieldName)} doit être inférieur à ${field.errors['max'].max}`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      code: 'Code UE',
      intitule: 'Intitulé',
      ects: 'ECTS',
      departementId: 'Département'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.ueForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}
