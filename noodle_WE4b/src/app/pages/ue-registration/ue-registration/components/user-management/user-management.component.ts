import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../../../../models/user.model'

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent {
  @Input() users: User[] = [];
  @Input() assignedUsers: User[] = [];

  @Output() userAdded = new EventEmitter<User>();
  @Output() userRemoved = new EventEmitter<User>();

  searchResults: User[] = [];
  userSearchTerm = '';
  showSearchResults = false;
  loadingUsers = false;

  async onUserSearch() {
    if (!this.userSearchTerm.trim()) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    this.loadingUsers = true;
    try {
      // Filtrer les utilisateurs localement
      const search = this.userSearchTerm.toLowerCase();
      this.searchResults = this.users.filter(user =>
        (user.nom.toLowerCase().includes(search) ||
          user.prenom.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)) &&
        !this.assignedUsers.some(assigned => assigned.id === user.id)
      );
      this.showSearchResults = true;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    } finally {
      this.loadingUsers = false;
    }
  }

  addUser(user: User) {
    this.userAdded.emit(user);
    // Retirer l'utilisateur des résultats de recherche
    this.searchResults = this.searchResults.filter(result => result.id !== user.id);
  }

  removeUser(user: User) {
    this.userRemoved.emit(user);
  }

  closeSearchResults() {
    this.showSearchResults = false;
    this.userSearchTerm = '';
    this.searchResults = [];
  }

  getRoleLabel(roles: string[]): string {
    if (roles.includes('ROLE_ADMIN')) return 'Administrateur';
    if (roles.includes('ROLE_PROF')) return 'Professeur';
    if (roles.includes('ROLE_USER')) return 'Étudiant';
    return 'Autre';
  }

  getRoleClass(roles: string[]): string {
    if (roles.includes('ROLE_ADMIN')) return 'role_admin';
    if (roles.includes('ROLE_PROF')) return 'role_prof';
    if (roles.includes('ROLE_USER')) return 'role_user';
    return 'role_other';
  }

  getInitials(user: User): string {
    return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
  }

  getPhotoUrl(photo: string): string {
    if (!photo || photo === 'null') return '';
    if (photo.startsWith('http')) return photo;
    return `http://localhost:3000/uploads/user/${photo}`;
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }
}
