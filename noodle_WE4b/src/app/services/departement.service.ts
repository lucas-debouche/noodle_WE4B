import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Departement } from '../models/departement.model';

@Injectable({
  providedIn: 'root'
})
export class DepartementService {
  private apiUrl = 'http://localhost:3000/api/departements';

  constructor(private http: HttpClient) {}

  getAllDepartements(): Observable<Departement[]> {
    return this.http.get<{success: boolean, data: Departement[]}>(`${this.apiUrl}`)
      .pipe(
        map(response => response.data || [])
      );
  }

  getDepartementById(id: string): Observable<Departement> {
    return this.http.get<{success: boolean, data: Departement}>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data)
      );
  }

  searchDepartements(query: string): Observable<Departement[]> {
    return this.http.get<{success: boolean, data: Departement[]}>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`)
      .pipe(
        map(response => response.data || [])
      );
  }

  createDepartement(departement: Partial<Departement>): Observable<Departement> {
    return this.http.post<{success: boolean, data: Departement}>(`${this.apiUrl}`, departement)
      .pipe(
        map(response => response.data)
      );
  }

  updateDepartement(id: string, departement: Partial<Departement>): Observable<Departement> {
    return this.http.put<{success: boolean, data: Departement}>(`${this.apiUrl}/${id}`, departement)
      .pipe(
        map(response => response.data)
      );
  }

  deleteDepartement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
