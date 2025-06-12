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
}
