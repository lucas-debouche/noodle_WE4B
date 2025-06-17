import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarService } from "../../services/navbar.service";
import { UesService } from "../../services/ues.service";
import { Ue } from "../../models/ue.model";
import { Post } from "../../models/post.model";


@Component({
  selector: 'app-mes-ue',
  templateUrl: './mes-ue.component.html',
  styleUrls: ['./mes-ue.component.scss']
})
export class MesUeComponent implements OnInit {
  currentUe!: Ue;
  selectedUeId: any;

  // Pour la progression globale
  allPosts: Post[] = [];
  allFaitStates: boolean[] = [];

  // Pour suivre les posts et états par section
  sectionPosts: { [section: string]: Post[] } = {};
  sectionFaitStates: { [section: string]: boolean[] } = {};

  sections = ['info', 'CM', 'TD', 'TP'];

  constructor(
    private navbarService: NavbarService,
    private route: ActivatedRoute,
    private uesService: UesService,
  ) {}

  ngOnInit(): void {
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

  // Appelé par chaque section quand ses posts sont chargés
  onPostsLoaded(section: string, posts: Post[]) {
    this.sectionPosts[section] = posts;
    this.sectionFaitStates[section] = posts.map(() => false);
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
}
