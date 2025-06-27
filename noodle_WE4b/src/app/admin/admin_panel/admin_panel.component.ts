import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import {User} from "../../models/user.model";
import {NavbarService} from "../../services/navbar.service";
import {UserService} from "../../services/user.service";


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
  deleteId: string | null = null;

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

  // États
  showNotification: boolean = false;
  notificationMessage: string = '';
  notificationType: 'success' | 'error' = 'success';
  isLoading: boolean = false;

  constructor(private adminService: AdminService, private navbarService: NavbarService, private utilisateurService: UserService) {}

  ngOnInit(): void {
    this.loadData();
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (user: User) => {
        this.navbarService.setTitle('Pannel Admin');
        this.navbarService.setCurrentUser(user); // Met à jour l'utilisateur dans le NavbarService
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération de l\'utilisateur actuel :', err);
      }
    });
  }

  loadData() {
    this.isLoading = true;
    this.adminService.getPanelData().subscribe({
      next: (data) => {
        console.log('Données reçues du backend :', data);
        this.ues = data.ues;
        this.users = data.users;
        this.filteredUes = this.ues;
        this.filteredUsers = this.users;
        this.applyUeFilters();
        this.applyUserFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des données :', error);
        this.showNotificationMessage('Erreur lors du chargement des données', 'error');
        this.isLoading = false;
      }
    });
  }

  switchTab(tab: 'ue' | 'users') {
    this.activeTab = tab;
  }

  applyUeFilters() {
    this.filteredUes = this.adminService.filterUes(this.ues, this.ueSearch, this.ueFilterField);
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
    const result = this.adminService.paginateData(this.filteredUes, this.ueCurrentPage, this.ueItemsPerPage);
    this.pagedUes = result.pagedData;
    this.ueTotalPages = result.totalPages;
  }

  changeUePage(page: number) {
    if (page >= 1 && page <= this.ueTotalPages) {
      this.ueCurrentPage = page;
      this.updateUePagination();
    }
  }

  applyUserFilters() {
    this.filteredUsers = this.adminService.filterUsers(this.users, this.userSearch, this.userFilterField, this.userFilterRole);
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
    const result = this.adminService.paginateData(this.filteredUsers, this.userCurrentPage, this.userItemsPerPage);
    this.pagedUsers = result.pagedData;
    this.userTotalPages = result.totalPages;
  }

  changeUserPage(page: number) {
    if (page >= 1 && page <= this.userTotalPages) {
      this.userCurrentPage = page;
      this.updateUserPagination();
    }
  }

  showDeleteConfirmation(type: 'ue' | 'user', id: string) {
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

    const deleteObservable = this.deleteType === 'ue'
      ? this.adminService.deleteUe(this.deleteId)
      : this.adminService.deleteUser(this.deleteId);

    deleteObservable.subscribe({
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

  showNotificationMessage(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    setTimeout(() => {
      this.hideNotification();
    }, 4000);
  }

  hideNotification() {
    this.showNotification = false;
  }

  // Méthodes déléguées au service
  getPaginationArray(totalPages: number): number[] {
    return this.adminService.getPaginationArray(totalPages);
  }

  getTruncatedText(text: string, maxLength: number = 50): string {
    return this.adminService.getTruncatedText(text, maxLength);
  }

  getRoleBadgeClass(role: string): string {
    return this.adminService.getRoleBadgeClass(role);
  }
}
