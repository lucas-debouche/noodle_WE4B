import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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
export class UeFormComponent implements OnChanges {
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
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingUe'] && this.editingUe && this.isEditMode) {
      this.ueForm.patchValue({
        code: this.editingUe.code,
        intitule: this.editingUe.intitule,
        description: this.editingUe.description,
        ects: this.editingUe.ects,
        departementId: this.editingUe.departementId
      });

      this.assignedUsers = this.users.filter(user =>
        this.editingUe?.participants?.includes(user._id) || false
      );

      this.imagePreview = this.editingUe.image ? this.getImageUrl(this.editingUe.image) : null;
    }
  }


  private initializeForm() {
    this.ueForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{2,8}$/)]],
      intitule: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.maxLength(500)]], // Description optionnelle
      ects: ['', [Validators.required, Validators.min(1), Validators.max(30)]],
      departementId: [''] // Pas de validation requise pour le debug
    });
  }

  private populateFormForEdit() {
    if (!this.editingUe) return;

    this.ueForm.patchValue({
      code: this.editingUe.code,
      intitule: this.editingUe.intitule,
      description: this.editingUe.description || '',
      ects: this.editingUe.ects,
      departementId: this.editingUe.departementId || ''
    });

    // Charger l'image si elle existe
    if (this.editingUe.image) {
      this.imagePreview = this.getImageUrl(this.editingUe.image);
    }

    // Charger les utilisateurs assignés
    this.loadAssignedUsers();
  }

  private async loadAssignedUsers() {
    if (!this.editingUe) return;

    try {
      console.log('👥 Chargement des utilisateurs assignés pour UE:', this.editingUe._id);

      console.log('🔍 Récupération des participants pour l\'UE:', this.editingUe._id);
      const participants: any = await this.uesService.getParticipantsByUe(this.editingUe._id).toPromise();

      console.log('📥 Participants reçus:', participants);

      if (Array.isArray(participants)) {
        this.assignedUsers = participants as User[];
      } else if (participants && typeof participants === 'object' && 'data' in participants && Array.isArray(participants.data)) {
        this.assignedUsers = participants.data as User[];
      } else {
        console.log('⚠️ Format de participants inattendu:', participants);
        this.assignedUsers = [];
      }

      console.log('✅ Utilisateurs assignés chargés:', this.assignedUsers.length);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs assignés:', error);
      this.assignedUsers = [];

      //  Essayer de récupérer depuis les données de l'UE elle-même
      if (this.editingUe.participants && Array.isArray(this.editingUe.participants)) {
        console.log('🔄 Utilisation des participants depuis les données UE');
        this.tryLoadUsersFromIds(this.editingUe.participants);
      }
    }
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
    // DEBUG: Afficher les valeurs du formulaire avant soumission
    const formValue = this.ueForm.value;
    console.log('📝 Valeurs du formulaire:', formValue);
    console.log('🏢 Département sélectionné:', formValue.departementId);
    console.log('🏢 Départements disponibles:', this.departements);

    if (this.ueForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;

    try {
      const formData = this.prepareFormData();

      console.log('📤 Données préparées pour envoi:', formData);

      if (this.isEditMode && this.editingUe) {
        const updatedUe = await this.uesService.updateUe(this.editingUe._id, formData).toPromise();
        this.ueUpdated.emit(updatedUe);
      } else {
        const newUe = await this.uesService.createUe(formData).toPromise();
        this.ueCreated.emit(newUe);
        this.resetForm();
      }

    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      this.error.emit(error instanceof Error ? error.message : 'Erreur lors de la soumission');
    } finally {
      this.submitting = false;
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
    this.resetForm();
    this.editCancelled.emit();
  }

  resetForm() {
    this.ueForm.reset();
    this.assignedUsers = [];
    this.imagePreview = null;
    this.selectedFile = null;
  }

  // Gestion des utilisateurs assignés
  onUserAdded(user: User) {
    if (!this.assignedUsers.some(assigned => assigned._id === user._id)) {
      this.assignedUsers.push(user);
    }
  }

  onUserRemoved(user: User) {
    this.assignedUsers = this.assignedUsers.filter(assigned => assigned._id !== user._id);
  }

  // Gestion de l'image
  onImageSelected(file: File | null) {
    this.selectedFile = file;
  }

  onImagePreviewChanged(preview: string | null) {
    this.imagePreview = preview;
  }

  // Méthodes utilitaires
  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `http://localhost:3000/uploads/ue/${imagePath}`;
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
