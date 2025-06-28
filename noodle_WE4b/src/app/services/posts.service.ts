import { Injectable } from '@angular/core';
import {Post} from "../models/post.model";
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = 'http://localhost:3000/api/post';

  constructor(private http: HttpClient) { }

  // Récupérer la liste des UEs
  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl);
  }

  getPostsByUe(ueId: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/ue/${ueId}`);
  }

  setFait(postId: string, utilisateurId: string, fait: boolean) {
    return this.http.patch<{success: boolean, faitPar: string[]}>(`${this.apiUrl}/${postId}/fait`, {
      utilisateurId,
      fait
    });
  }

  createPost(data: any, isFormData = false): Observable<Post> {
    console.log("data", data, "isFormData", isFormData);
    if (isFormData) {
      return this.http.post<Post>(`${this.apiUrl}`, data);
    } else {
      return this.http.post<Post>(`${this.apiUrl}`, data, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  uploadRendu(postId: string, formData: FormData) {
    return this.http.post(`${this.apiUrl}/${postId}/rendu`, formData);
  }

  attribuerNote(postId: string, userId: string, note: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${postId}/rendu/${userId}/note`, { note });
  }

  enregistrerCommentaire(postId: string, userId: string, commentaire: string) {
    return this.http.patch(`${this.apiUrl}/${postId}/rendu/${userId}/commentaire`, { commentaire });
  }
}
