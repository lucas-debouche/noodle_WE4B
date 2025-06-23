import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Type } from '../models/type.model';

@Injectable({ providedIn: 'root' })
export class TypeService {
  private apiUrl = 'http://localhost:3000/api/type';

  constructor(
    private http: HttpClient,
  ) {}

  getTypes(): Observable<Type[]> {
    return this.http.get<Type[]>(this.apiUrl);
  }

  getTypeById(id: string): Observable<Type> {
    return this.http.get<Type>(`${this.apiUrl}/${id}`);
  }
}
