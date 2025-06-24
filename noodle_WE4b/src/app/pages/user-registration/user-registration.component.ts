import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {UserPhotoUploadComponent} from "../../user/user-photo-upload/user-photo-upload.component";


@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  styleUrls: ['./user-registration.component.scss']
})

export class UserRegistrationComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild(UserPhotoUploadComponent) photoUploadComponent!: UserPhotoUploadComponent;


  registrationForm: FormGroup;
  editMode = false;
  userId: string | null = null;
  departements: any[] = [];
  roles: string[] = [];
  successMessage: string = '';
  errorMessage: string = '';
  showUeModal: boolean = false;
  showDeleteModal: boolean = false;
  currentStep: number = 1;
  isSubmitting: boolean = false;
  resetPhotoTrigger = 0;


  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.registrationForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      plainPassword: ['', [Validators.required, Validators.minLength(6)]],
      roles: [[], Validators.required],
      departement: [''],
      ues: [[]],
      photo: [null]
    });

  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadDepartements();
    this.updateCurrentStep();

    // Écouter les changements du formulaire pour mettre à jour la progression
    this.registrationForm.valueChanges.subscribe(() => {
      this.updateCurrentStep();
    });
  }

  // Mise à jour automatique de l'étape en cours basée sur les champs complétés
  private updateCurrentStep(): void {
    const values = this.registrationForm.value;

    // Étape 1: Informations personnelles (nom, prénom)
    if (!values.nom || !values.prenom) {
      this.currentStep = 1;
      return;
    }

    // Étape 2: Compte utilisateur (email, mot de passe)
    if (!values.email || !values.plainPassword ||
      this.registrationForm.get('email')?.invalid ||
      this.registrationForm.get('plainPassword')?.invalid) {
      this.currentStep = 2;
      return;
    }

    // Étape 3: Photo de profil (optionnelle, passe automatiquement)
    if (!values.roles || values.roles.length === 0) {
      this.currentStep = 3;
      return;
    }

    // Étape 4: Rôles et permissions
    this.currentStep = 4;
  }



  // Vérifier si une étape est complétée
  isStepCompleted(step: number): boolean {
    const values = this.registrationForm.value;

    switch (step) {
      case 1:
        return !!(values.nom && values.prenom);
      case 2:
        return !!(values.email && values.plainPassword &&
          this.registrationForm.get('email')?.valid &&
          this.registrationForm.get('plainPassword')?.valid);
      case 3:
        return true; // Étape photo optionnelle, toujours considérée comme complétée
      case 4:
        return !!(values.roles && values.roles.length > 0);
      default:
        return false;
    }
  }

  // Soumission du formulaire
  submit(): void {
    if (this.registrationForm.invalid) {
      this.markAllFieldsAsTouched();
      this.showError('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    this.isSubmitting = true;
    const formData = this.prepareFormData();

    // Simulation d'appel API
    setTimeout(() => {
      if (this.editMode && this.userId) {
        this.updateUser(formData);
      } else {
        this.createUser(formData);
      }
    }, 2000);
  }

  private prepareFormData(): FormData {
    const formData = new FormData();

    Object.entries(this.registrationForm.value).forEach(([key, value]) => {
      if (key === 'roles' && Array.isArray(value)) {
        (value as string[]).forEach((role: string) =>
          formData.append('roles[]', role)
        );
      } else if (key === 'ues' && Array.isArray(value)) {
        (value as string[]).forEach((ue: string) =>
          formData.append('ues[]', ue)
        );
      } else if (key !== 'photo' && value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    // Ajouter le fichier photo s'il existe
    if (this.photoUploadComponent?.photoFile) {
      formData.append('photo', this.photoUploadComponent.photoFile);
    }

    return formData;
  }


  private markAllFieldsAsTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      this.registrationForm.get(key)?.markAsTouched();
    });
  }

  private createUser(formData: FormData): void {
    this.http.post('http://localhost:3000/api/utilisateur', formData).subscribe({
      next: (res) => {
        this.showSuccess('Utilisateur créé avec succès !');
        setTimeout(() => this.resetForm(), 3000);
        this.isSubmitting = false;
      },
      error: (err) => {
        this.showError('Erreur lors de la création de l\'utilisateur.');
        this.isSubmitting = false;
      }
    });
  }

  private updateUser(formData: FormData): void {
    this.http.put(`http://localhost:3000/api/utilisateur/${this.userId}`, formData).subscribe({
      next: (res) => {
        this.showSuccess('Utilisateur modifié avec succès !');
        this.resetForm();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.showError('Erreur lors de la modification de l\'utilisateur.');
        this.isSubmitting = false;
      }
    });
  }

  deleteUser(id: string): void {
    // Simulation de suppression
    // this.userService.deleteUser(id).subscribe({
    //   next: () => {
    //     this.showSuccess('Utilisateur supprimé avec succès !');
    //     this.resetForm();
    //   },
    //   error: () => {
    //     this.showError('Erreur lors de la suppression.');
    //   }
    // });

    this.showDeleteModal = false;
    this.showSuccess('Utilisateur supprimé avec succès !');
  }

  // Chargement des données
  private loadRoles(): void {
    this.http.get<any[]>('http://localhost:3000/api/role').subscribe({
      next: (data) => {
        this.roles = data.map(role => role.nom);
      },
      error: () => {
        this.roles = ['ERROR', 'ERROR', 'ERROR'];
      }
    });
  }

  private loadDepartements(): void {
    this.http.get<any[]>('http://localhost:3000/api/ue').subscribe({
      next: (data) => {
        this.departements = data;
      },
      error: () => {
        this.departements = [];
      }
    });
  }

  loadUser(userId: string): void {
    this.http.get<any>(`http://localhost:3000/api/utilisateur/${userId}`).subscribe({
      next: (user) => {
        this.registrationForm.patchValue({
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          roles: user.role,
          // Ajoute les autres champs si besoin
        });
        this.userId = userId;
        this.editMode = true;
      },
      error: () => {
        this.showError('Impossible de charger l\'utilisateur.');
      }
    });
  }


  // Réinitialisation du formulaire
  resetForm(): void {
    this.registrationForm.reset();
    this.editMode = false;
    this.userId = null;
    this.currentStep = 1;
    this.isSubmitting = false;
    this.clearMessages();
    this.resetPhotoTrigger++;
  }

  // Gestion des messages
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.clearMessages(), 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.clearMessages(), 5000);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

}
