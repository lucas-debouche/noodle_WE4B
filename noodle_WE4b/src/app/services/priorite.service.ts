import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Priorite } from '../models/priorite.model';

@Injectable({ providedIn: 'root' })
export class PrioriteService {
  private apiUrl = 'http://localhost:3000/api/priorite';

  constructor(
    private http: HttpClient,
  ) {}

  getPriorites(): Observable<Priorite[]> {
    return this.http.get<Priorite[]>(this.apiUrl);
  }
}
