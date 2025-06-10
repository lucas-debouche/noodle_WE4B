import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { User } from "../shared/models/user.model";
import { UtilisateurService } from "../services/utilisateur.service";

@Component({
  selector: 'app-profil',
  templateUrl: './profil-sidebar.component.html',
  styleUrls: ['./profil-sidebar.component.scss']
})
export class ProfilSidebarComponent implements OnInit {
  user: User | undefined; // Utilisateur connecté récupéré via un service
  @Output() updateProfil = new EventEmitter<any>(); // Événement émis lors de la sauvegarde des modifications
  isOpen = false;

  profil = {
    nom: '',
    prenom: '',
    plainPassword: '',
    confirmPassword: '',
    photo: "",
    photoPreview: ''
  };

  constructor(private utilisateurService: UtilisateurService) {}

  ngOnInit(): void {
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (data: User) => {
        this.user = data;

        // Remplir profil avec les données utilisateur récupérées
        this.profil.nom = this.user.nom || '';
        this.profil.prenom = this.user.prenom || '';
        this.profil.plainPassword = this.user.motPasse || '';
        this.profil.photo = this.user.photo || '';
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l\'utilisateur :', err);
      }
    });
  }

  // Basculer l'ouverture de la sidebar
  toggleProfilSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  // Prévisualisation de l'image chargée
  onPhotoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profil.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
      this.profil.photo = file; // Mettre à jour avec le fichier sélectionné
    }
  }

  saveProfil(): void {
    const formData = new FormData();

    // Ajouter les champs texte au formulaire
    formData.append('nom', this.profil.nom);
    formData.append('prenom', this.profil.prenom);
    formData.append('plainPassword', this.profil.plainPassword);

    // Vérifier s'il existe une nouvelle photo sélectionnée
    if (this.profil.photo && typeof this.profil.photo === 'object' && 'name' in this.profil.photo) {
      formData.append('photo', this.profil.photo as File); // Ajouter la nouvelle photo
    } else if (this.user?.photo) {
      formData.append('photo', this.user.photo); // Sinon, conserver l'existant
    }

    // Envoi des données au backend pour mise à jour
    this.utilisateurService.updateUtilisateur(formData).subscribe({
      next: (response) => {
        console.log('Profil mis à jour avec succès :', response);
        this.user = response.utilisateur; // Mettre à jour le profil côté client
        this.toggleProfilSidebar(); // Fermer la sidebar
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du profil :', err);
      }
    });
  }
}
