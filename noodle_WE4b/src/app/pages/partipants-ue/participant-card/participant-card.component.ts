import { Component, Input } from '@angular/core';
import { ParticipantWithUeInfo } from '../../../models/participant-ue.model';

@Component({
  selector: 'app-participant-card',
  templateUrl: './participant-card.component.html',
  styleUrls: ['./participant-card.component.scss']
})
export class ParticipantCardComponent {
  @Input() participant!: ParticipantWithUeInfo;
  @Input() isProfesseur: boolean = false;

  getInitials(): string {
    return `${this.participant.prenom.charAt(0)}${this.participant.nom.charAt(0)}`.toUpperCase();
  }

  getParticipantBadgeColor(): string {
    if (this.isProfesseur) {
      return 'professor';
    }

    if (this.participant.statut === 'inactif') {
      return 'inactive';
    }

    // Couleur basée sur la promotion pour les étudiants
    if (this.participant.promotion) {
      const promotions = ['L1', 'L2', 'L3', 'M1', 'M2'];
      const index = promotions.indexOf(this.participant.promotion);
      return index !== -1 ? `promotion-${index}` : 'default';
    }

    return 'default';
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getRoleType(): 'etudiant' | 'professeur' | 'admin' | 'autre' {
    const roles = this.participant.role;
    if (roles.includes('ROLE_ADMIN')) return 'admin';
    if (roles.includes('ROLE_PROF')) return 'professeur';
    if (roles.includes('ROLE_USER') && !roles.includes('ROLE_PROF') && !roles.includes('ROLE_ADMIN')) return 'etudiant';
    return 'autre';
  }

  getRoleLabel(): string {
    const roleType = this.getRoleType();
    switch (roleType) {
      case 'etudiant':
        return 'Étudiant';
      case 'professeur':
        return 'Professeur';
      case 'admin':
        return 'Administrateur';
      default:
        return 'Autre';
    }
  }

  getRoleIcon(): string {
    const roleType = this.getRoleType();
    switch (roleType) {
      case 'etudiant':
        return '🎓';
      case 'professeur':
        return '👨‍🏫';
      case 'admin':
        return '👑';
      default:
        return '👤';
    }
  }

  getPhotoUrl(): string {
    if (!this.participant.photo || this.participant.photo === 'null') {
      return '';
    }

    if (this.participant.photo.startsWith('http')) {
      return this.participant.photo;
    }

    if (this.participant.photo.startsWith('/uploads')) {
      return `http://localhost:3000${this.participant.photo}`;
    }

    // Construire le chemin basé sur la structure: /uploads/user/{nom}/photo_profil/{filename}
    return `http://localhost:3000/uploads/user/${this.participant.nom}/photo_profil/${this.participant.photo}`;
  }

  onImageError(event: any) {
    console.log(`❌ Erreur chargement image pour ${this.participant.prenom} ${this.participant.nom}:`, this.participant.photo);
    // Cacher l'image et afficher les initiales
    event.target.style.display = 'none';
  }
}
