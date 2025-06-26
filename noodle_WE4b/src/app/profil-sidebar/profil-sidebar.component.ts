import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { User } from "../models/user.model";
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, FormControl, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import {UserService} from "../services/user.service";

@Component({
  selector: 'app-profil',
  templateUrl: './profil-sidebar.component.html',
  styleUrls: ['./profil-sidebar.component.scss']
})

export class ProfilSidebarComponent implements OnInit {
  user!: User;
  @Output() updateProfil = new EventEmitter<any>();
  isOpen = false;
  toggleBtnShifted = false;
  profilForm!: FormGroup;
  photoPreview: string = '';
  showPassword = false;
  showConfirmPassword = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private utilisateurService: UserService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.profilForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      plainPassword: ['', [this.passwordValidator]],
      confirmPassword: [''],
      photo: [null]
    }, { validators: this.passwordMatchValidator });

    if (this.ShouldShowProfilSidebar()) {
      this.loadUserData();
    }
  }

  loadUserData(): void {
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (data: User) => {
        this.user = data;
        this.profilForm.patchValue({
          nom: this.user.nom || '',
          prenom: this.user.prenom || '',
          plainPassword: '',
          confirmPassword: '',
          photo: this.user.photo || ''
        });
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement du profil';
        console.error('Erreur lors de la récupération de l\'utilisateur :', err);
      }
    });
  }

  // Validateur de mot de passe personnalisé
  passwordValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // Si le champ est vide, on ne valide pas (optionnel pour la modification)
    if (!value || value.length === 0) {
      return null;
    }

    const errors: any = {};

    if (value.length < 10) {
      errors['minLength'] = true;
    }

    if (!/[A-Z].*[A-Z]/.test(value)) {
      errors['uppercase'] = true;
    }

    if (!/\d/.test(value)) {
      errors['number'] = true;
    }

    if ((value.match(/[!@#$%^&*()_+\-=\[\]{} ':"\\|,.<>\/?]/g) || []).length < 2) {
      errors['specialChars'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Validateur de correspondance des mots de passe
  passwordMatchValidator = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('plainPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  toggleProfilSidebar(): void {
    this.isOpen = !this.isOpen;
    this.clearMessages();

    const profilSidebarToggle = document.querySelector('#profilSidebarToggle');
    if (profilSidebarToggle) {
      profilSidebarToggle.classList.remove('profil-open', 'shifted-sidebar', 'shifted-profil', 'shifted-both');
      if (this.isOpen) {
        profilSidebarToggle.classList.add('profil-open');
        const mainSidebar = document.querySelector('.sidebar');
        if (mainSidebar && mainSidebar.classList.contains('open')) {
          profilSidebarToggle.classList.add('shifted-both');
        } else {
          profilSidebarToggle.classList.add('shifted-profil');
        }
      } else {
        const mainSidebar = document.querySelector('.sidebar');
        if (mainSidebar && mainSidebar.classList.contains('open')) {
          profilSidebarToggle.classList.add('shifted-sidebar');
        }
      }
    }
    this.toggleBtnShifted = this.isOpen;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    const passwordField = document.getElementById('plainPassword') as HTMLInputElement;
    if (passwordField) {
      passwordField.type = this.showPassword ? 'text' : 'password';
    }
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
    const confirmPasswordField = document.getElementById('confirmPassword') as HTMLInputElement;
    if (confirmPasswordField) {
      confirmPasswordField.type = this.showConfirmPassword ? 'text' : 'password';
    }
  }

  onPhotoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'La taille de l\'image ne doit pas dépasser 5MB';
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Veuillez sélectionner un fichier image valide';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
      this.profilForm.patchValue({ photo: file });
      this.clearMessages();
    }
  }

  clearMessages(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  saveProfil(): void {
    this.clearMessages();

    if (this.profilForm.invalid) {
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire';
      this.markFormGroupTouched(this.profilForm);
      return;
    }

    this.isLoading = true;
    const formData = new FormData();

    formData.append('nom', this.profilForm.value.nom);
    formData.append('prenom', this.profilForm.value.prenom);

    // N'envoyer le mot de passe que s'il a été modifié
    if (this.profilForm.value.plainPassword) {
      formData.append('plainPassword', this.profilForm.value.plainPassword);
    }

    const photo = this.profilForm.value.photo;
    if (photo && typeof photo === 'object' && 'name' in photo) {
      formData.append('photo', photo as File);
    } else if (this.user?.photo) {
      formData.append('photo', this.user.photo);
    }

    this.utilisateurService.updateUtilisateur(formData, this.profilForm.value.nom).subscribe({
      next: (response) => {
        this.user = response.utilisateur;
        this.successMessage = 'Profil mis à jour avec succès !';
        this.isLoading = false;

        // Reset password fields
        this.profilForm.patchValue({
          plainPassword: '',
          confirmPassword: ''
        });
        this.photoPreview = '';

        // Auto-fermer après 2 secondes
        setTimeout(() => {
          this.toggleProfilSidebar();
        }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour du profil';
        console.error('Erreur lors de la mise à jour du profil :', err);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper methods pour le template
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.profilForm.get(fieldName);
    return !!(field?.errors?.[errorType] && (field?.dirty || field?.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.profilForm.get(fieldName);
    return !!(field?.valid && (field?.dirty || field?.touched));
  }

  hasPasswordMismatch(): boolean {
    return !!(this.profilForm.errors?.['passwordMismatch'] &&
      this.profilForm.get('confirmPassword')?.touched);
  }

  ShouldShowProfilSidebar(): boolean {
    return !this.router.url.startsWith('/login');
  }
}
