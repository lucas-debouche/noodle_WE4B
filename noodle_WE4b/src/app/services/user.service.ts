import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormControl, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) {}

  /**
   * Création d'un utilisateur
   */
  createUser(formData: FormData): Observable<any> {
    return this.http.post('http://localhost:3000/api/utilisateur', formData);
  }

  /**
   * Modification d'un utilisateur
   */
  updateUser(userId: string, formData: FormData): Observable<any> {
    return this.http.put(`http://localhost:3000/api/utilisateur/${userId}`, formData);
  }

  /**
   * Récupération d'un utilisateur
   */
  getUser(userId: string): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/api/utilisateur/${userId}`);
  }

  /**
   * Récupération des rôles
   */
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/role');
  }

  /**
   * Récupération des départements
   */
  getDepartements(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/ue');
  }

  /**
   * Préparation des données FormData
   */
  prepareFormData(formValue: any, photoFile?: File | null | undefined): FormData {
    const formData = new FormData();

    Object.entries(formValue).forEach(([key, value]) => {
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

    if (photoFile) {
      formData.append('photo', photoFile);
    }

    return formData;
  }

  /**
   * Validation des étapes
   */
  isStepCompleted(step: number, formValue: any, hasPhoto: boolean = false): boolean {
    switch (step) {
      case 1:
        return !!(formValue.nom && formValue.prenom);
      case 2:
        return !!(formValue.email && formValue.plainPassword);
      case 3:
        return true; // Photo optionnelle
      case 4:
        return !!(formValue.roles && formValue.roles.length > 0);
      default:
        return false;
    }
  }

  /**
   * Détermination de l'étape actuelle
   */
  getCurrentStep(formValue: any): number {
    if (!formValue.nom || !formValue.prenom) {
      return 1;
    }
    if (!formValue.email || !formValue.plainPassword) {
      return 2;
    }
    if (!formValue.roles || formValue.roles.length === 0) {
      return 4;
    }
    return 4;
  }

  /**
   * Marquer tous les champs comme touchés
   */
  markAllFieldsAsTouched(formGroup: any): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }
}

/**
 * Fonction de validation de mot de passe
 */
export function passwordValidator(control: FormControl): ValidationErrors | null {
  const errors: any = {};
  const value = control.value || '';

  if (value.length < 10) errors['minLength'] = true;
  if ((value.match(/[A-Z]/g) || []).length < 2) errors['uppercase'] = true;
  if (!/\d/.test(value)) errors['number'] = true;
  if ((value.match(/[!@#$%^&*()_+\-=\[\]{} ':"\\|,.<>\/?]/g) || []).length < 2) errors['specialChars'] = true;

  return Object.keys(errors).length ? errors : null;
}
