import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {Ue} from "../../models/ue.model";
import {User} from "../../models/user.model";
import {UesService} from "../../services/ues.service";
import {UtilisateurService} from "../../services/utilisateur.service";
import {Departement} from "../../models/departement.model";


@Component({
  selector: 'app-ue-registration',
  templateUrl: './ue-registration.component.html',
  styleUrls: ['./ue-registration.component.scss']
})
export class UeRegistrationComponent implements OnInit {
  ueForm: FormGroup = this.fb.group({});
  ues: Ue[] = [];
  users: User[] = [];
  departements: Departement[] = [];
  filteredUes: Ue[] = [];
  searchResults: User[] = [];
  assignedUsers: User[] = [];

  // États
  loading = false;
  loadingUsers = false;
  submitting = false;
  error = '';
  success = '';

  // Mode édition
  isEditMode = false;
  editingUe: Ue | null = null;

  // Recherche et filtres
  searchTerm = '';
  userSearchTerm = '';
  showSearchResults = false;

  // Preview image
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private uesService: UesService,
    private utilisateurService: UtilisateurService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadInitialData();
  }

  private initializeForm() {
    this.ueForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{2,8}$/)]],
      intitule: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      ects: ['', [Validators.required, Validators.min(1), Validators.max(30)]],
      departementId: ['', Validators.required],
      image: ['']
    });
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
      this.filteredUes = [...this.ues];

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

  // Gestion du formulaire
  async onSubmit() {
    if (this.ueForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    this.error = '';
    this.success = '';

    try {
      const formData = this.prepareFormData();

      if (this.isEditMode && this.editingUe) {
        await this.updateUe(formData);
      } else {
        await this.createUe(formData);
      }

      await this.loadInitialData();
      this.resetForm();

    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      this.error = error instanceof Error ? error.message : 'Erreur lors de la soumission';
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

  private async createUe(ueData: any) {
    const newUe = await this.uesService.createUe(ueData).toPromise();
    this.success = 'UE créée avec succès !';
    return newUe;
  }

  private async updateUe(ueData: any) {
    if (!this.editingUe) return;

    const updatedUe = await this.uesService.updateUe(this.editingUe.id, ueData).toPromise();
    this.success = 'UE mise à jour avec succès !';
    return updatedUe;
  }

  private markFormGroupTouched() {
    Object.keys(this.ueForm.controls).forEach(key => {
      const control = this.ueForm.get(key);
      control?.markAsTouched();
    });
  }

  // Gestion de l'édition
  editUe(ue: Ue) {
    this.isEditMode = true;
    this.editingUe = ue;

    // Remplir le formulaire avec les données de l'UE
    this.ueForm.patchValue({
      code: ue.code,
      intitule: ue.intitule,
      description: ue.description || '',
      ects: ue.ects,
      departementId: ue.departementId || ''
    });

    // Charger l'image si elle existe
    if (ue.image) {
      this.imagePreview = this.getImageUrl(ue.image);
    }

    // Charger les utilisateurs assignés
    this.loadAssignedUsers(ue.id);

    // Scroller vers le formulaire
    setTimeout(() => {
      const formElement = document.querySelector('.ue-form-container');
      formElement?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  private async loadAssignedUsers(ueId: string) {
    try {
      const participants = await this.uesService.getParticipantsByUe(ueId).toPromise();
      this.assignedUsers = participants || [];
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs assignés:', error);
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editingUe = null;
    this.resetForm();
  }

  resetForm() {
    this.ueForm.reset();
    this.assignedUsers = [];
    this.imagePreview = null;
    this.selectedFile = null;
    this.error = '';
    this.success = '';
  }

  // Gestion de la suppression
  async deleteUe(ue: Ue) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'UE "${ue.code} - ${ue.intitule}" ?`)) {
      return;
    }

    try {
      await this.uesService.deleteUe(ue.id).toPromise();
      this.success = 'UE supprimée avec succès !';
      await this.loadInitialData();

      // Si on était en train d'éditer cette UE, annuler l'édition
      if (this.editingUe?.id === ue.id) {
        this.cancelEdit();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      this.error = 'Erreur lors de la suppression de l\'UE';
    }
  }

  // Gestion de la recherche d'UE
  onUeSearchChange() {
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

  // Gestion de la recherche d'utilisateurs
  async onUserSearch() {
    if (!this.userSearchTerm.trim()) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    this.loadingUsers = true;
    try {
      // Filtrer les utilisateurs localement ou appeler une API
      this.searchResults = this.users.filter(user =>
        (user.nom.toLowerCase().includes(this.userSearchTerm.toLowerCase()) ||
          user.prenom.toLowerCase().includes(this.userSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(this.userSearchTerm.toLowerCase())) &&
        !this.assignedUsers.some(assigned => assigned.id === user.id)
      );
      this.showSearchResults = true;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    } finally {
      this.loadingUsers = false;
    }
  }

  // Gestion des utilisateurs assignés
  addUser(user: User) {
    if (!this.assignedUsers.some(assigned => assigned.id === user.id)) {
      this.assignedUsers.push(user);
      this.searchResults = this.searchResults.filter(result => result.id !== user.id);
    }
  }

  removeUser(user: User) {
    this.assignedUsers = this.assignedUsers.filter(assigned => assigned.id !== user.id);
  }

  // Gestion de l'image
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Créer l'aperçu
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Méthodes utilitaires
  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `http://localhost:3000/uploads/${imagePath}`;
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

  trackByUeId(index: number, ue: Ue): string {
    return ue.id;
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }
}
