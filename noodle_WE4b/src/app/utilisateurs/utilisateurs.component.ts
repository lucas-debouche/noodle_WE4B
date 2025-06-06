import { Component, OnInit } from '@angular/core';
import { UtilisateurService } from '../services/utilisateur.service';
import { User } from '../shared/models/user.model';

@Component({
  selector: 'app-utilisateur',
  templateUrl: `./utilisateurs.component.html`
})
export class UtilisateurComponent implements OnInit {
  utilisateurs: User[] = [];

  constructor(private utilisateurService: UtilisateurService) {}

  ngOnInit() {
    this.utilisateurService.getUtilisateurs().subscribe(data => {
      console.log("Données reçues :", data);
      this.utilisateurs = data;
    });
  }
}
