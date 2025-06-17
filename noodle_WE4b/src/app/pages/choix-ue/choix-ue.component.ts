import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ue } from "../../models/ue.model";
import { User } from "../../models/user.model";
import { UtilisateurService } from "../../services/utilisateur.service";
import { NavbarService} from "../../services/navbar.service";

@Component({
  selector: 'app-choix-ue',
  templateUrl: './choix-ue.component.html',
  styleUrls: ['./choix-ue.component.scss']
})
export class ChoixUeComponent implements OnInit {
  allUes: Ue[] = [];
  displayedUes: Ue[] = [];
  offset_ue = 0;
  limit_ue = 3;
  isExpandedUe = false;


  constructor(
    private http: HttpClient,
    private utilisateurService: UtilisateurService,
    private navbarService: NavbarService,
  ) {}

  ngOnInit(): void {
    this.navbarService.setTitle('Choix UEs');
    this.loadUes();
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (user: User) => {
        this.navbarService.setTitle('Choix UEs');
        this.navbarService.setCurrentUser(user); // Met à jour l'utilisateur dans le NavbarService
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération de l\'utilisateur actuel :', err);
      }
    });
  }

loadUes(): void {
  this.http.get<Ue[]>(`http://localhost:3000/api/ue`)
    .subscribe({
      next: (data: Ue[]) => {
        this.allUes = data;
        this.displayUes();
      },
      error: (err) => console.error('Erreur lors du chargement des UEs :', err)
    });
}

displayUes(): void {
  if (!this.isExpandedUe) {
    // Afficher un lot de UEs
    const currentBatch = this.allUes.slice(this.offset_ue, this.offset_ue + this.limit_ue);
    this.displayedUes = [...this.displayedUes, ...currentBatch];
    this.offset_ue += this.limit_ue;

    if (this.offset_ue >= this.allUes.length) {
      this.isExpandedUe = true;
    }
  } else {
    // Mode "Voir moins"
    this.displayedUes = this.allUes.slice(0, this.limit_ue);
    this.offset_ue = this.limit_ue;
    this.isExpandedUe = false;
  }
}

get toggleButtonTextUe(): string {
  return this.isExpandedUe ? 'Voir moins' : 'Voir plus';
}
}
