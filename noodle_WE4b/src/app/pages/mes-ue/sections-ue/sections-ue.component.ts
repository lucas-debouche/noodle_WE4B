import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { PostsService } from '../../../services/posts.service';
import { Post } from '../../../models/post.model';
import { UserService } from "../../../services/user.service";
import { User } from "../../../models/user.model";

@Component({
  selector: 'app-sections-ue',
  templateUrl: './sections-ue.component.html',
  styleUrls: ['./sections-ue.component.scss']
})
export class SectionsUeComponent implements OnInit, OnChanges {
  @Input() sectionTitle: string = '';
  @Input() ueId: string = '';

  @Output() postsLoaded = new EventEmitter<Post[]>();
  @Output() faitChange = new EventEmitter<{index: number, value: boolean}>();

  opened = true;
  posts: Post[] = [];
  faitStates: boolean[] = [];
  currentUser!: User;
  totalUsers: number = 0;
  utilisateursUeIds: string[] = [];


  constructor(
    private postsService: PostsService,
    private utilisateurService: UserService
  ) { }

  ngOnInit(): void {
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (user: User) => {
        this.currentUser = user;
        // Récupère le nombre total d'utilisateurs assignés à l'UE
        if (this.ueId) {
          this.utilisateurService.getUtilisateursByUe(this.ueId).subscribe((users: User[]) => {
            this.totalUsers = users.length;
            this.utilisateursUeIds = users.map(u => (u as any)._id || (u as any).id);
            if (this.sectionTitle) {
              this.loadPosts();
            }
          });
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.ueId && this.sectionTitle && this.currentUser) {
      this.loadPosts();
    }
  }

  private loadPosts() {
    this.postsService.getPostsByUe(this.ueId).subscribe((posts: Post[]) => {
      this.posts = posts.filter(post =>
        post.categorie && post.categorie.trim().toLowerCase() === this.sectionTitle.trim().toLowerCase()
      );
      const userId = (this.currentUser && (this.currentUser as any)._id) ? (this.currentUser as any)._id : '';
      this.faitStates = this.posts.map(post =>
        !!(post.faitPar && Array.isArray(post.faitPar) && userId && post.faitPar.includes(userId))
      );
      this.postsLoaded.emit(this.posts);
    });
  }

  toggleSection() {
    this.opened = !this.opened;
  }

  onFaitChange(index: number, value: boolean) {
    this.faitStates[index] = value;
    this.faitChange.emit({index, value});
  }
}
