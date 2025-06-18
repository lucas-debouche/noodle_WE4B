import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarService } from "../../services/navbar.service";
import { UesService } from "../../services/ues.service";
import { Ue } from "../../models/ue.model";
import { Post } from "../../models/post.model";
import { UtilisateurService } from "../../services/utilisateur.service";
import { User } from "../../models/user.model";


@Component({
  selector: 'app-mes-ue',
  templateUrl: './mes-ue.component.html',
  styleUrls: ['./mes-ue.component.scss']
})
export class MesUeComponent implements OnInit {
  currentUe!: Ue;
  selectedUeId: any;
  currentUser!: User;
  allPosts: Post[] = [];
  allFaitStates: boolean[] = [];
  sectionPosts: { [section: string]: Post[] } = {};
  sectionFaitStates: { [section: string]: boolean[] } = {};
  showCreatePostModal = false;


  sections = ['info', 'CM', 'TD', 'TP'];

  constructor(
    private navbarService: NavbarService,
    private route: ActivatedRoute,
    private uesService: UesService,
    private utilisateurService: UtilisateurService
  ) {}

  ngOnInit(): void {
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (user: User) => {
        this.currentUser = user;
        const ueId = this.route.snapshot.paramMap.get('id');
        if (typeof ueId === 'string') {
          this.uesService.getUeById(ueId).subscribe((ue: Ue) => {
            this.currentUe = ue;
            this.navbarService.setTitle(this.currentUe.intitule);
            this.selectedUeId = ueId;
            // Initialisation
            this.sections.forEach(section => {
              this.sectionPosts[section] = [];
              this.sectionFaitStates[section] = [];
            });
            this.allPosts = [];
            this.allFaitStates = [];
          });
        }
      }
    });
  }

  // Appelé par chaque section quand ses posts sont chargés
  onPostsLoaded(section: string, posts: Post[]) {
    this.sectionPosts[section] = posts;
    // Initialise les états "fait" à partir du champ faitPar et de l'utilisateur courant
    const userId = (this.currentUser as any)._id || (this.currentUser as any).id;
    this.sectionFaitStates[section] = posts.map(post =>
      !!(post.faitPar && Array.isArray(post.faitPar) && userId && post.faitPar.includes(userId))
    );
    this.updateAllPostsAndFaits();
  }

  // Appelé par chaque section quand un bouton "fait" change
  onFaitChange(section: string, index: number, value: boolean) {
    this.sectionFaitStates[section][index] = value;
    this.updateAllPostsAndFaits();
  }

  // Met à jour la liste globale pour la barre de progression
  updateAllPostsAndFaits() {
    this.allPosts = [];
    this.allFaitStates = [];
    this.sections.forEach(section => {
      this.allPosts = this.allPosts.concat(this.sectionPosts[section]);
      this.allFaitStates = this.allFaitStates.concat(this.sectionFaitStates[section]);
    });
  }

  get nbFaits(): number {
    return this.allFaitStates.filter(f => f).length;
  }
  get nbPosts(): number {
    return this.allPosts.length;
  }

  openCreatePostModal() {
    this.showCreatePostModal = true;
  }

  closeCreatePostModal() {
    this.showCreatePostModal = false;
  }

  // Rafraîchit la section concernée après création
  onPostCreated(newPost: Post) {
    let section = 'info';
    if (newPost.type_id && typeof newPost.type_id === 'object' && 'nom' in newPost.type_id) {
      section = (newPost.type_id as any).nom;
    }
    if (this.sectionPosts[section]) {
      this.sectionPosts[section].push(newPost);
      this.sectionFaitStates[section].push(false);
      this.updateAllPostsAndFaits();
    }
    this.closeCreatePostModal();
  }
}


