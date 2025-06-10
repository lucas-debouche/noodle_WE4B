import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ue } from "../../shared/models/ue.model";
import { Post } from "../../shared/models/post.model";
import { User } from "../../shared/models/user.model";
import { UtilisateurService } from "../../services/utilisateur.service";

@Component({
  selector: 'app-choix-ue',
  templateUrl: './choix-ue.component.html',
  styleUrls: ['./choix-ue.component.scss']
})
export class ChoixUeComponent implements OnInit {
  ues: Ue[] = [];
  posts: Post[] = [];
  offset_ue = 0;
  limit_ue = 3;
  offset_activity = 0;
  limit_activity = 3;
  isExpandedUe = false;
  isExpandedActivities = false;
  isSidebarOpen = false;
  currentUser: User | null = null; // Pour stocker les données de l'utilisateur actuel


  constructor(private http: HttpClient, private utilisateurService: UtilisateurService
  ) {}

  ngOnInit(): void {
    this.loadUes();
    this.loadActivities();
    this.getCurrentUser();
  }

loadUes(): void {
  this.http.get(`http://localhost:3000/api/ue?offset=${this.offset_ue}&limit=${this.limit_ue}`)
    .subscribe((response: any) => {
      if (Array.isArray(response)) {
        this.ues = response;
      } else {
        console.error('Invalid response format, expected an array:', response);
        this.ues = [];
      }
    });
}

  // Charger les activités
  loadActivities(): void {
    this.http
      .get(`http://localhost:3000/api/post?offset=${this.offset_activity}&limit=${this.limit_activity}`)
      .subscribe((response: any) => {
        this.posts = response;
      });
  }

  getCurrentUser(): void {
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (user: User) => {
        console.log('Utilisateur actuel récupéré :', user);
        this.currentUser = user; // Stockez l'utilisateur dans une variable locale
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l\'utilisateur actuel :', err);
      }
    });
  }


  // Voir plus ou réduire
  toggleExpandUe(): void {
    this.isExpandedUe = !this.isExpandedUe;
    if (this.isExpandedUe) {
      this.offset_ue += this.limit_ue;
      this.loadUes();
    } else {
      this.ues = this.ues.slice(0, this.limit_ue);
    }
  }

  toggleExpandActivities(): void {
    this.isExpandedActivities = !this.isExpandedActivities;
    if (this.isExpandedActivities) {
      this.offset_activity += this.limit_activity;
      this.loadUes();
    } else {
      this.posts = this.posts.slice(0, this.limit_activity);
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

}
