import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin_panel',
  templateUrl: './admin_panel.component.html',
  styleUrls: ['./admin_panel.component.scss']
})
export class Admin_panelComponent implements OnInit {
  activeTab: 'ue' | 'users' = 'ue';

  ues: any[] = [];
  users: any[] = [];

  ueSearch: string = '';
  ueFilterField: string = 'all';
  filteredUes: any[] = [];

  userSearch: string = '';
  userFilterField: string = 'all';
  userFilterRole: string = 'all';
  filteredUsers: any[] = [];

  showDeleteModal: boolean = false;
  deleteMessage: string = '';
  deleteType: 'ue' | 'user' | null = null;
  deleteId: number | null = null;

  // Pagination UE
  ueCurrentPage: number = 1;
  ueItemsPerPage: number = 6;
  ueTotalPages: number = 1;
  pagedUes: any[] = [];

  // Pagination Utilisateurs
  userCurrentPage: number = 1;
  userItemsPerPage: number = 6;
  userTotalPages: number = 1;
  pagedUsers: any[] = [];

  // Nouveaux états pour les notifications
  showNotification: boolean = false;
  notificationMessage: string = '';
  notificationType: 'success' | 'error' = 'success';
  isLoading: boolean = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.http.get<any>('http://localhost:3000/api/admin/panel_data').subscribe(data => {
      console.log('Données reçues du backend :', data);
      this.ues = data.ues;
      this.users = data.users;
      this.filteredUes = this.ues;
      this.filteredUsers = this.users;
      this.applyUeFilters();
      this.applyUserFilters();
      this.isLoading = false;
    }, error => {
      console.error('Erreur lors de la récupération des données :', error);
      this.showNotificationMessage('Erreur lors du chargement des données', 'error');
      this.isLoading = false;
    });
  }

  switchTab(tab: 'ue' | 'users') {
    this.activeTab = tab;
  }

  applyUeFilters() {
    const search = this.ueSearch.toLowerCase();
    this.filteredUes = this.ues.filter(ue => {
      if (this.ueFilterField === 'all') {
        return (
          ue.code?.toLowerCase().includes(search) ||
          ue.intitule?.toLowerCase().includes(search) ||
          ue.description?.toLowerCase().includes(search)
        );
      } else if (this.ueFilterField === 'code') {
        return ue.code?.toLowerCase().includes(search);
      } else if (this.ueFilterField === 'intitule') {
        return ue.intitule?.toLowerCase().includes(search);
      } else if (this.ueFilterField === 'description') {
        return ue.description?.toLowerCase().includes(search);
      }
      return false;
    });
    this.ueCurrentPage = 1;
    this.updateUePagination();
  }

  resetUeFilters() {
    this.ueSearch = '';
    this.ueFilterField = 'all';
    this.applyUeFilters();
    this.showNotificationMessage('Filtres réinitialisés', 'success');
  }

  updateUePagination() {
    this.ueTotalPages = Math.ceil(this.filteredUes.length / this.ueItemsPerPage) || 1;
    const start = (this.ueCurrentPage - 1) * this.ueItemsPerPage;
    const end = start + this.ueItemsPerPage;
    this.pagedUes = this.filteredUes.slice(start, end);
  }

  changeUePage(page: number) {
    if (page >= 1 && page <= this.ueTotalPages) {
      this.ueCurrentPage = page;
      this.updateUePagination();
    }
  }

  applyUserFilters() {
    const search = this.userSearch.toLowerCase();
    this.filteredUsers = this.users.filter(user => {
      let matchField = true;
      if (this.userFilterField !== 'all') {
        if (this.userFilterField === 'nom') {
          matchField = user.nom?.toLowerCase().includes(search);
        } else if (this.userFilterField === 'prenom') {
          matchField = user.prenom?.toLowerCase().includes(search);
        } else if (this.userFilterField === 'email') {
          matchField = user.email?.toLowerCase().includes(search);
        } else if (this.userFilterField === 'role') {
          matchField = user.role && user.role.join(',').toLowerCase().includes(search);
        } else {
          matchField = false;
        }
      } else {
        matchField =
          user.nom?.toLowerCase().includes(search) ||
          user.prenom?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          (user.role && user.role.join(',').toLowerCase().includes(search));
      }
      let matchRole =
        this.userFilterRole === 'all' ||
        (user.role && user.role.includes(this.userFilterRole));
      return matchField && matchRole;
    });
    this.userCurrentPage = 1;
    this.updateUserPagination();
  }

  resetUserFilters() {
    this.userSearch = '';
    this.userFilterField = 'all';
    this.userFilterRole = 'all';
    this.applyUserFilters();
    this.showNotificationMessage('Filtres réinitialisés', 'success');
  }

  updateUserPagination() {
    this.userTotalPages = Math.ceil(this.filteredUsers.length / this.userItemsPerPage) || 1;
    const start = (this.userCurrentPage - 1) * this.userItemsPerPage;
    const end = start + this.userItemsPerPage;
    this.pagedUsers = this.filteredUsers.slice(start, end);
  }

  changeUserPage(page: number) {
    if (page >= 1 && page <= this.userTotalPages) {
      this.userCurrentPage = page;
      this.updateUserPagination();
    }
  }

  showDeleteConfirmation(type: 'ue' | 'user', id: number) {
    this.showDeleteModal = true;
    this.deleteType = type;
    this.deleteId = id;
    this.deleteMessage =
      type === 'ue'
        ? 'Voulez-vous vraiment supprimer cette UE ?'
        : 'Voulez-vous vraiment supprimer cet utilisateur ?';
  }

  hideDeleteConfirmation() {
    this.showDeleteModal = false;
    this.deleteType = null;
    this.deleteId = null;
    this.deleteMessage = '';
  }

  confirmDelete() {
    if (!this.deleteId || !this.deleteType) return;

    this.isLoading = true;
    let url = '';
    if (this.deleteType === 'ue') {
      url = `http://localhost:3000/api/admin/ue/${this.deleteId}`;
    } else if (this.deleteType === 'user') {
      url = `http://localhost:3000/api/admin/user/${this.deleteId}`;
    }

    this.http.delete(url).subscribe({
      next: () => {
        if (this.deleteType === 'ue') {
          this.ues = this.ues.filter(ue => ue._id !== this.deleteId);
          this.applyUeFilters();
          this.showNotificationMessage('UE supprimée avec succès', 'success');
        } else if (this.deleteType === 'user') {
          this.users = this.users.filter(user => user._id !== this.deleteId);
          this.applyUserFilters();
          this.showNotificationMessage('Utilisateur supprimé avec succès', 'success');
        }
        this.hideDeleteConfirmation();
        this.isLoading = false;
      },
      error: (error) => {
        const itemType = this.deleteType === 'ue' ? 'UE' : 'utilisateur';
        this.showNotificationMessage(`Erreur lors de la suppression de ${itemType}`, 'error');
        this.hideDeleteConfirmation();
        this.isLoading = false;
      }
    });
  }

  // Nouvelle méthode pour afficher les notifications
  showNotificationMessage(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    // Auto-hide après 4 secondes
    setTimeout(() => {
      this.hideNotification();
    }, 4000);
  }

  hideNotification() {
    this.showNotification = false;
  }

  // Méthode utilitaire pour générer un array pour la pagination
  getPaginationArray(totalPages: number): number[] {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Méthodes utilitaires pour l'affichage
  getTruncatedText(text: string, maxLength: number = 50): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  getRoleBadgeClass(role: string): string {
    switch(role) {
      case 'ROLE_ADMIN': return 'badge-admin';
      case 'ROLE_PROF': return 'badge-prof';
      case 'ROLE_USER': return 'badge-user';
      default: return 'badge-default';
    }
  }
}
