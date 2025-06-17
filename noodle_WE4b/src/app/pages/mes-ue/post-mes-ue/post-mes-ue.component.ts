import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Post } from '../../../models/post.model';
import { User } from "../../../models/user.model";
import { UtilisateurService } from "../../../services/utilisateur.service";

@Component({
  selector: 'app-post-mes-ue',
  templateUrl: './post-mes-ue.component.html',
  styleUrls: ['./post-mes-ue.component.scss']
})
export class PostMesUeComponent implements OnInit {
  @Input() post!: Post;
  @Input() fait: boolean = false;
  @Output() faitChange = new EventEmitter<boolean>();
  currentUser!: User;

  constructor(
    private utilisateurService: UtilisateurService,
  ) { }

  ngOnInit(): void {
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (data: User) => {
        this.currentUser = data;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l\'utilisateur :', err);
      }
    });
  }

  isUtilisateurObj(utilisateur: any): utilisateur is { nom?: string; prenom?: string } {
    return utilisateur && typeof utilisateur === 'object' && ('nom' in utilisateur || 'prenom' in utilisateur);
  }

  getTypeNom(post: Post): string {
    if (post.type_id && typeof post.type_id === 'object' && 'nom' in post.type_id) {
      return (post.type_id as any).nom;
    }
    return '';
  }

  toggleFait() {
    this.fait = !this.fait;
    this.faitChange.emit(this.fait);
  }
}
