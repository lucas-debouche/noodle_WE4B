import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ue } from '../models/ue.model';

@Injectable({
  providedIn: 'root',
})
export class UesService {
  private apiUrl = 'http://localhost:3000/api/ue';

  constructor(private http: HttpClient) {}

  // Récupérer la liste des UEs
  getUes(): Observable<Ue[]> {
    return this.http.get<Ue[]>(this.apiUrl);
  }

}
