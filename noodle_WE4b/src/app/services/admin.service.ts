import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) {}

  /**
   * Récupération des données du panel
   */
  getPanelData(): Observable<any> {
    return this.http.get<any>('http://localhost:3000/api/admin/panel_data');
  }

  /**
   * Suppression d'une UE
   */
  deleteUe(ueId: string): Observable<any> {
    return this.http.delete(`http://localhost:3000/api/admin/ue/${ueId}`);
  }

  /**
   * Suppression d'un utilisateur
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`http://localhost:3000/api/admin/user/${userId}`);
  }

  /**
   * Filtrage des UEs
   */
  filterUes(ues: any[], search: string, filterField: string): any[] {
    const searchLower = search.toLowerCase();
    return ues.filter(ue => {
      if (filterField === 'all') {
        return (
          ue.code?.toLowerCase().includes(searchLower) ||
          ue.intitule?.toLowerCase().includes(searchLower) ||
          ue.description?.toLowerCase().includes(searchLower)
        );
      } else if (filterField === 'code') {
        return ue.code?.toLowerCase().includes(searchLower);
      } else if (filterField === 'intitule') {
        return ue.intitule?.toLowerCase().includes(searchLower);
      } else if (filterField === 'description') {
        return ue.description?.toLowerCase().includes(searchLower);
      }
      return false;
    });
  }

  /**
   * Filtrage des utilisateurs
   */
  filterUsers(users: any[], search: string, filterField: string, filterRole: string): any[] {
    const searchLower = search.toLowerCase();

    let filtered = users.filter(user => {
      let matchField = true;
      if (filterField !== 'all') {
        if (filterField === 'nom') {
          matchField = user.nom?.toLowerCase().includes(searchLower);
        } else if (filterField === 'prenom') {
          matchField = user.prenom?.toLowerCase().includes(searchLower);
        } else if (filterField === 'email') {
          matchField = user.email?.toLowerCase().includes(searchLower);
        } else if (filterField === 'role') {
          matchField = user.role && user.role.join(',').toLowerCase().includes(searchLower);
        } else {
          matchField = false;
        }
      } else {
        matchField =
          user.nom?.toLowerCase().includes(searchLower) ||
          user.prenom?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          (user.role && user.role.join(',').toLowerCase().includes(searchLower));
      }

      let matchRole = filterRole === 'all' || (user.role && user.role.includes(filterRole));
      return matchField && matchRole;
    });

    return filtered;
  }

  /**
   * Pagination
   */
  paginateData(data: any[], currentPage: number, itemsPerPage: number): any {
    const totalPages = Math.ceil(data.length / itemsPerPage) || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedData = data.slice(start, end);

    return {
      pagedData,
      totalPages
    };
  }

  /**
   * Génération array pagination
   */
  getPaginationArray(totalPages: number): number[] {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  /**
   * Troncature de texte
   */
  getTruncatedText(text: string, maxLength: number = 50): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Classe CSS pour les badges de rôle
   */
  getRoleBadgeClass(role: string): string {
    switch(role) {
      case 'ROLE_ADMIN': return 'badge-admin';
      case 'ROLE_PROF': return 'badge-prof';
      case 'ROLE_USER': return 'badge-user';
      default: return 'badge-default';
    }
  }
}
