import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
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
      { headers: this.getAuthHeaders() }
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
    return this.http.post(
      `${this.apiUrl}/${forumId}/messages`,
      { message },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Ajouter une réponse à un message
  addReply(forumId: string, messageId: string, message: string): Observable<any> {
    console.log(`ForumService → POST add reply to messageId = ${messageId}`);
    return this.http.post(
      `${this.apiUrl}/${forumId}/messages/${messageId}/replies`,
      { message },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Modifier le titre d'un forum (ROLE_PROF, ROLE_ADMIN)
  updateForumTitle(forumId: string, title: string): Observable<any> {
    console.log(`ForumService → PUT update forum title for forumId = ${forumId}`);
    return this.http.put(
      `${this.apiUrl}/${forumId}/title`,
      { title },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Supprimer un forum (ROLE_ADMIN)
  deleteForum(forumId: string): Observable<any> {
    console.log(`ForumService → DELETE forum for forumId = ${forumId}`);
    return this.http.delete(
      `${this.apiUrl}/${forumId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Modifier un message (ROLE_PROF, ROLE_ADMIN)
  updateMessage(forumId: string, messageId: string, message: string): Observable<any> {
    console.log(`ForumService → PUT update message for messageId = ${messageId}`);
    return this.http.put(
      `${this.apiUrl}/${forumId}/messages/${messageId}`,
      { message },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Supprimer un message (ROLE_PROF, ROLE_ADMIN)
  deleteMessage(forumId: string, messageId: string): Observable<any> {
    console.log(`ForumService → DELETE message for messageId = ${messageId}`);
    return this.http.delete(
      `${this.apiUrl}/${forumId}/messages/${messageId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Supprimer une réponse (ROLE_PROF, ROLE_ADMIN)
  deleteReply(forumId: string, messageId: string, replyId: string): Observable<any> {
    console.log(`ForumService → DELETE reply for replyId = ${replyId}`);
    return this.http.delete(
      `${this.apiUrl}/${forumId}/messages/${messageId}/replies/${replyId}`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Modifier une réponse (ROLE_PROF, ROLE_ADMIN)
  updateReply(forumId: string, messageId: string, replyId: string, message: string): Observable<any> {
    console.log(`ForumService → PUT update reply for replyId = ${replyId}`);
    // Cette route n'existe pas encore côté serveur
    return this.http.put(
      `${this.apiUrl}/${forumId}/messages/${messageId}/replies/${replyId}`,
      { message },
      { headers: this.getAuthHeaders() }
    ).pipe(
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
