import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  constructor(private router: Router) {}

  shouldShowFooter(): boolean {
    // Vérifie si l'URL actuelle ne commence pas par '/login'
    return !this.router.url.startsWith('/login');
  }
}
