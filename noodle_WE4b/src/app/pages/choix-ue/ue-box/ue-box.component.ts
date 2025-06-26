import { Component, OnInit, Input } from '@angular/core';
import { Ue } from '../../../models/ue.model';
import {PostsService} from "../../../services/posts.service";
import {Post} from "../../../models/post.model";
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-ue-box',
  templateUrl: './ue-box.component.html',
  styleUrls: ['./ue-box.component.scss']
})
export class UeBoxComponent implements OnInit {
  @Input() ue!: Ue;
  currentUser!: User;
  nbPosts: number = 0;
  nbFaits: number = 0;

  constructor(
    private postsService: PostsService,
    private utilisateurService: UserService
  ) { }

  ngOnInit(): void {
    this.getPostsAndCountFaits();
    this.utilisateurService.getUtilisateurActuel().subscribe({
      next: (user: User) => {
        this.currentUser = user;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l\'utilisateur actuel :', err);
      }
    });
  }

  getPostsAndCountFaits(): void {
    this.postsService.getPostsByUe(this.ue._id).subscribe(posts => {
      this.nbPosts = posts.length;
      this.nbFaits = this.countFaits(posts);
      console.log(this.nbPosts, this.nbFaits);
    });
  }

  countFaits(posts: Post[]): number {
    return posts.filter(post => post.faitPar && post.faitPar.includes(this.currentUser._id)).length;
  }
}
