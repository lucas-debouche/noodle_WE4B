import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, passwordValidator } from '../../services/user.service';
import { UserPhotoUploadComponent } from "../../user/user-photo-upload/user-photo-upload.component";
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  styleUrls: ['./user-registration.component.scss']
})
export class UserRegistrationComponent implements OnInit {
  @ViewChild(UserPhotoUploadComponent) photoUploadComponent!: UserPhotoUploadComponent;

  registrationForm: FormGroup;
  editMode = false;
  userId: string | null = null;
  departements: any[] = [];
  roles: string[] = [];
  successMessage: string = '';
  errorMessage: string = '';
  currentStep: number = 1;
  isSubmitting: boolean = false;
  resetPhotoTrigger = 0;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute
  ) {
    this.registrationForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      plainPassword: ['', [Validators.required, passwordValidator]],
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

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    }

    this.registrationForm.valueChanges.subscribe(() => {
      this.updateCurrentStep();
    });
  }

  private updateCurrentStep(): void {
    this.currentStep = this.userService.getCurrentStep(this.registrationForm.value);
  }

  isStepCompleted(step: number): boolean {
    const hasPhoto = !!this.photoUploadComponent?.photoFile;
    return this.userService.isStepCompleted(step, this.registrationForm.value, hasPhoto);
  }

  submit(): void {
    if (this.registrationForm.invalid) {
      this.userService.markAllFieldsAsTouched(this.registrationForm);
      this.showError('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    this.isSubmitting = true;
    const photoFile = this.photoUploadComponent?.photoFile;
    const formData = this.userService.prepareFormData(this.registrationForm.value, photoFile);

    const submitObservable = this.editMode && this.userId
      ? this.userService.updateUser(this.userId, formData)
      : this.userService.createUser(formData);

    submitObservable.subscribe({
      next: (res) => {
        const message = this.editMode ? 'Utilisateur modifié avec succès !' : 'Utilisateur créé avec succès !';
        this.showSuccess(message);
        if (!this.editMode) {
          setTimeout(() => this.resetForm(), 3000);
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        this.showError('Erreur lors de la soumission du formulaire.');
        this.isSubmitting = false;
      }
    });
  }

  private loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (data) => {
        this.roles = data.map(role => role.nom);
      },
      error: () => {
        this.roles = ['ERROR', 'ERROR', 'ERROR'];
      }
    });
  }

  private loadDepartements(): void {
    this.userService.getDepartements().subscribe({
      next: (data) => {
        this.departements = data;
      },
      error: () => {
        this.departements = [];
      }
    });
  }

  loadUser(userId: string): void {
    this.userService.getUser(userId).subscribe({
      next: (user) => {
        console.log('Chargement de l\'utilisateur:', user);
        this.registrationForm.patchValue({
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          plainPassword: user.mot_passe,
          roles: Array.isArray(user.role) ? user.role : [user.role],
          ues: Array.isArray(user.ues) ? user.ues : (user.ues ? [user.ues] : []),
          photo: user.photo || null
        });
        this.userId = userId;
        this.editMode = true;
      },
      error: () => {
        this.showError('Impossible de charger l\'utilisateur.');
      }
    });
  }

  resetForm(): void {
    this.registrationForm.reset();
    this.editMode = false;
    this.userId = null;
    this.currentStep = 1;
    this.isSubmitting = false;
    this.clearMessages();
    this.resetPhotoTrigger++;
  }

  goBack(): void {
    window.history.back();
  }

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
