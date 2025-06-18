import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Post } from '../../../models/post.model';
import { User } from "../../../models/user.model";
import { UtilisateurService } from "../../../services/utilisateur.service";
import { PostsService } from "../../../services/posts.service";

@Component({
  selector: 'app-post-mes-ue',
  templateUrl: './post-mes-ue.component.html',
  styleUrls: ['./post-mes-ue.component.scss']
})
export class PostMesUeComponent implements OnInit {
  @Input() post!: Post;
  @Input() fait: boolean = false;
  @Input() totalUsers: number = 0; // Ajouté
  @Output() faitChange = new EventEmitter<boolean>();
  currentUser!: User;
  faitCount: number = 0;

  constructor(
    private utilisateurService: UtilisateurService,
    private postsService: PostsService
  ) { }

  ngOnInit(): void {
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (data: User) => {
        this.currentUser = data;
        const userId = (this.currentUser as any)._id || (this.currentUser as any).id;
        if (this.post.faitPar && Array.isArray(this.post.faitPar)) {
          this.fait = this.post.faitPar.includes(userId);
          this.faitCount = this.post.faitPar.length;
        } else {
          this.faitCount = 0;
        }
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
    if (!this.currentUser) return;
    const userId = (this.currentUser as any)._id || (this.currentUser as any).id;
    if (!userId) return;
    const newFait = !this.fait;
    this.postsService.setFait(this.post._id, userId, newFait).subscribe({
      next: (res) => {
        this.fait = newFait;
        // Met à jour le nombre d'utilisateurs ayant fait ce post
        if (res && res.faitPar) {
          this.faitCount = res.faitPar.length;
          this.post.faitPar = res.faitPar;
        }
        this.faitChange.emit(this.fait);
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du statut fait :', err);
      }
    });
  }
}
