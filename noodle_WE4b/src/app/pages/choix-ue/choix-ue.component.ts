import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ue } from "../../models/ue.model";
import { User } from "../../models/user.model";
import { UserService } from "../../services/user.service";
import { NavbarService} from "../../services/navbar.service";

@Component({
  selector: 'app-choix-ue',
  templateUrl: './choix-ue.component.html',
  styleUrls: ['./choix-ue.component.scss']
})
export class ChoixUeComponent implements OnInit {
  UesOfUser: Ue[] = [];
  displayedUes: Ue[] = [];
  offset_ue = 0;
  limit_ue = 3;
  isExpandedUe = false;
  currentUser!: User;


  constructor(
    private http: HttpClient,
    private utilisateurService: UserService,
    private navbarService: NavbarService,
  ) {}

  ngOnInit(): void {
    this.navbarService.setTitle('Tableau de bord');
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (user: User) => {
        this.currentUser = user;
        this.navbarService.setTitle('Tableau de bord');
        this.navbarService.setCurrentUser(user); // Met à jour l'utilisateur dans le NavbarService
        this.loadUesOfUser();
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération de l\'utilisateur actuel :', err);
      }
    });
  }

  loadUesOfUser(): void {
    this.utilisateurService.getUesByUserId(this.currentUser._id).subscribe({
      next: (ues: Ue[]) => {
        this.UesOfUser = ues;
        console.log('Ues of user:', this.UesOfUser);
        this.displayUes();
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération des UEs de l\'utilisateur :', err);
      }
    });
  }

  displayUes(): void {
    if (!this.isExpandedUe) {
      // Afficher un lot de UEs
      const currentBatch = this.UesOfUser.slice(this.offset_ue, this.offset_ue + this.limit_ue);
      this.displayedUes = [...this.displayedUes, ...currentBatch];
      this.offset_ue += this.limit_ue;

      if (this.offset_ue >= this.UesOfUser.length) {
        this.isExpandedUe = true;
      }
    } else {
      // Mode "Voir moins"
      this.displayedUes = this.UesOfUser.slice(0, this.limit_ue);
      this.offset_ue = this.limit_ue;
      this.isExpandedUe = false;
    }
  }

  get toggleButtonTextUe(): string {
    return this.isExpandedUe ? 'Voir moins' : 'Voir plus';
  }
}
