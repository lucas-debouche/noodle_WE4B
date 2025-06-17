import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { User } from "../models/user.model";
import { UtilisateurService } from "../services/utilisateur.service";
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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

  constructor(
    private utilisateurService: UtilisateurService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.profilForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      plainPassword: [''],
      confirmPassword: [''],
      photo: [null]
    });

    if (this.ShouldShowProfilSidebar()) {
      this.utilisateurService.getUtilisateurActuel().subscribe({
        next: (data: User) => {
          this.user = data;
          this.profilForm.patchValue({
            nom: this.user.nom || '',
            prenom: this.user.prenom || '',
            plainPassword: this.user.motPasse || '',
            photo: this.user.photo || ''
          });
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de l\'utilisateur :', err);
        }
      });
    }
  }

  toggleProfilSidebar(): void {
    this.isOpen = !this.isOpen;
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

  onPhotoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
      this.profilForm.patchValue({ photo: file });
    }
  }

  saveProfil(): void {
    if (this.profilForm.invalid) return;
    const formData = new FormData();
    formData.append('nom', this.profilForm.value.nom);
    formData.append('prenom', this.profilForm.value.prenom);
    formData.append('plainPassword', this.profilForm.value.plainPassword);

    const photo = this.profilForm.value.photo;
    if (photo && typeof photo === 'object' && 'name' in photo) {
      formData.append('photo', photo as File);
    } else if (this.user?.photo) {
      formData.append('photo', this.user.photo);
    }

    this.utilisateurService.updateUtilisateur(formData, this.profilForm.value.nom).subscribe({
      next: (response) => {
        this.user = response.utilisateur;
        this.toggleProfilSidebar();
      },
      error: (err: any) => {
        console.error('Erreur lors de la mise à jour du profil :', err);
      }
    });
  }

  ShouldShowProfilSidebar(): boolean {
    return !this.router.url.startsWith('/login');
  }
}
