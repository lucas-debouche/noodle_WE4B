import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UesService } from '../../../../services/ues.service';
import { Ue } from '../../../../models/ue.model';
import { User } from '../../../../models/user.model';
import { Departement } from '../../../../models/departement.model';

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

  ueForm: FormGroup;
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingUe'] && this.editingUe) {
      this.populateFormForEdit();
    } else if (changes['editingUe'] && !this.editingUe) {
      this.resetForm();
    }
  }

  private initializeForm() {
    this.ueForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{2,8}$/)]],
      intitule: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      ects: ['', [Validators.required, Validators.min(1), Validators.max(30)]],
      departementId: ['', Validators.required]
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
      const participants = await this.uesService.getParticipantsByUe(this.editingUe.id).toPromise();
      this.assignedUsers = participants || [];
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs assignés:', error);
    }
  }

  async onSubmit() {
    if (this.ueForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;

    try {
      const formData = this.prepareFormData();

      if (this.isEditMode && this.editingUe) {
        const updatedUe = await this.uesService.updateUe(this.editingUe.id, formData).toPromise();
        this.ueUpdated.emit(updatedUe);
      } else {
        const newUe = await this.uesService.createUe(formData).toPromise();
        this.ueCreated.emit(newUe);
        this.resetForm();
      }

    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      this.error.emit(error instanceof Error ? error.message : 'Erreur lors de la soumission');
    } finally {
      this.submitting = false;
    }
  }

  private prepareFormData(): any {
    const formValue = this.ueForm.value;
    return {
      ...formValue,
      assignedUsers: this.assignedUsers.map(u => u.id),
      image: this.selectedFile
    };
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
    if (!this.assignedUsers.some(assigned => assigned.id === user.id)) {
      this.assignedUsers.push(user);
    }
  }

  onUserRemoved(user: User) {
    this.assignedUsers = this.assignedUsers.filter(assigned => assigned.id !== user.id);
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
