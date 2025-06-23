import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private baseUrl = 'http://localhost:3000/api/forums';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private handleError(error: any): Observable<never> {
    console.log('ForumService Error →');
    console.log(error);
    let errorMessage = 'Une erreur est survenue, réessayez plus tard.';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  // Récupérer les forums par UE
  getForumsByUe(ueId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${ueId}`)
      .pipe(catchError(this.handleError));
  }

  // Créer un nouveau forum
  createForum(ueId: string, title: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { ueId, title };

    return this.http.post<any>(this.baseUrl, body, { headers })
      .pipe(catchError(this.handleError));
  }

  // Récupérer le détail d'un forum
  getForumDetail(forumId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/detail/${forumId}`)
      .pipe(catchError(this.handleError));
  }

  // Ajouter un message avec fichiers
  addMessage(forumId: string, message: string, files?: FileList): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();

    formData.append('message', message);

    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('attachments', files[i]);
      }
    }

    return this.http.post<any>(`${this.baseUrl}/${forumId}/messages`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  // Ajouter une réponse avec fichiers
  addReply(forumId: string, messageId: string, message: string, files?: FileList): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();

    formData.append('message', message);

    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('attachments', files[i]);
      }
    }

    return this.http.post<any>(`${this.baseUrl}/${forumId}/messages/${messageId}/replies`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  // Modifier le titre d'un forum
  updateForumTitle(forumId: string, title: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { title };

    return this.http.put<any>(`${this.baseUrl}/${forumId}/title`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  // Modifier un message
  updateMessage(forumId: string, messageId: string, message: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { message };

    return this.http.put<any>(`${this.baseUrl}/${forumId}/messages/${messageId}`, body, { headers })
      .pipe(catchError(this.handleError));
  }

  updateReply(forumId: string, messageId:string,replyId: string, message: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { message };
    return this.http.put<any>(`${this.baseUrl}/${forumId}/messages/${messageId}/replies/${replyId}`, body, { headers })
      .pipe(catchError(this.handleError));

  }

  // Supprimer un message
  deleteMessage(forumId: string, messageId: string): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.delete<any>(`${this.baseUrl}/${forumId}/messages/${messageId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Supprimer une réponse
  deleteReply(forumId: string, messageId: string, replyId: string): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.delete<any>(`${this.baseUrl}/${forumId}/messages/${messageId}/replies/${replyId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Supprimer un forum
  deleteForum(forumId: string): Observable<any> {
    const headers = this.getAuthHeaders();

    return this.http.delete<any>(`${this.baseUrl}/${forumId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Télécharger un fichier
  downloadFile(filename: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${filename}`, {
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // Obtenir l'URL de téléchargement
  getDownloadUrl(filename: string): string {
    return `${this.baseUrl}/download/${filename}`;
  }

  // Utilitaires pour les fichiers
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
    if (mimeType === 'text/plain') return '📄';
    return '📎';
  }

  isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }
}
