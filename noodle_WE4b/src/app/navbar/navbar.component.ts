import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Input() title: string = 'Noodle'; // Le titre est configurable grâce à ce paramètre.
  isLoggedIn: boolean = true; // Simule si l'utilisateur est connecté.
  isAdmin: boolean = true; // Simule si l'utilisateur est admin.
  hasRoles: boolean = true; // Simule des rôles spécifiques (ROLE_ADMIN ou ROLE_USER).

  logout(): void {
    alert('Déconnexion effectuée !'); // Ajoute ici la vraie logique de déconnexion.
  }
}
