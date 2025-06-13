import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ForumService {
  private apiUrl = 'http://localhost:3000/api/forums';

  constructor(private http: HttpClient) {}

  // Récupérer les forums par UE
  getForumsByUe(ueId: string): Observable<any> {
    console.log(`ForumService → GET forums for ueId = ${ueId}`);
    return this.http.get(`${this.apiUrl}/${ueId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Créer un nouveau forum
  createForum(ueId: string, title: string): Observable<any> {
    console.log(`ForumService → POST create forum for ueId = ${ueId}, title = "${title}"`);
    return this.http.post(
      this.apiUrl,
      { ueId, title },
      { headers: this.getAuthHeaders() } // ← ici c'est important
    ).pipe(
      catchError(this.handleError)
    );
  }


  // Récupérer le détail d'un forum
  getForumDetail(forumId: string): Observable<any> {
    console.log(`ForumService → GET detail for forumId = ${forumId}`);
    return this.http.get(`${this.apiUrl}/detail/${forumId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Ajouter un message à un forum
  addMessage(forumId: string, message: string): Observable<any> {
    console.log(`ForumService → POST add message to forumId = ${forumId}`);
    return this.http.post(`${this.apiUrl}/${forumId}/messages`, { message }).pipe(
      catchError(this.handleError)
    );
  }

  // Gestion des erreurs générique
  private handleError(error: HttpErrorResponse) {
    console.error('ForumService Error →', error);
    return throwError(() => new Error('Une erreur est survenue, réessayez plus tard.'));
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }


}
