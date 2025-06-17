import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { User } from "../models/user.model";
import { NavbarService } from '../services/navbar.service';
import { Router } from '@angular/router';
import { UtilisateurService } from '../services/utilisateur.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  title: string = 'Noodle'; // Le titre est configurable grâce à ce paramètre.
  currentUser: User | null = null; // L'utilisateur actuel, récupéré depuis le service NavbarService.
  isLoggedIn: boolean = false; // Simule si l'utilisateur est connecté.
  isAdmin: boolean = false; // Simule si l'utilisateur est admin.
  hasRoles: boolean = false; // Simule si l'utilisateur a des rôles.

  constructor(
    private authService: AuthService,
    private navbarService: NavbarService,
    private router: Router,
    private utilisateurService: UtilisateurService,
  ) {}

  ngOnInit(): void {
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (user: User) => {
        this.navbarService.setCurrentUser(user); // Met à jour l'utilisateur dans le NavbarService
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération de l\'utilisateur actuel :', err);
      }
    });
    this.navbarService.getTitle().subscribe(title => {
      this.title = title; // Met à jour le titre depuis le NavbarService.
    });
    this.navbarService.getCurrentUser().subscribe(user => {
      this.currentUser = user; // Met à jour l'utilisateur actuel depuis le NavbarService.
      if (this.currentUser) {
        this.isLoggedIn = true;
        this.isAdmin = this.currentUser.role.includes('ROLE_ADMIN');
        this.hasRoles = this.currentUser.role.length > 0;
      } else {
        this.isLoggedIn = false;
        this.isAdmin = false;
        this.hasRoles = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  shouldShowNavbar(): boolean {
    // Vérifie si l'URL actuelle ne commence pas par '/login'
    return !this.router.url.startsWith('/login');
  }
}
