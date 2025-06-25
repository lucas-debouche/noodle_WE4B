import { Component, OnInit, Input } from '@angular/core';
import { Ue } from '../models/ue.model';
import {PostsService} from "../services/posts.service";
import {Post} from "../models/post.model";

@Component({
  selector: 'app-ue-box',
  templateUrl: './ue-box.component.html',
  styleUrls: ['./ue-box.component.scss']
})
export class UeBoxComponent implements OnInit {
  @Input() ue!: Ue;
  nbPosts: number = 0;
  nbFaits: number = 0;

  constructor(
    private postsService: PostsService
  ) { }

  ngOnInit(): void {
    this.getPostsAndCountFaits();
  }

  getPostsAndCountFaits(): void {
    this.postsService.getPostsByUe(this.ue._id).subscribe(posts => {
      this.nbPosts = posts.length;
      this.nbFaits = this.countFaits(posts);
      console.log(this.nbPosts, this.nbFaits);
    });
  }

  countFaits(posts: Post[]): number {
    return posts.filter(post => post.faitPar && post.faitPar.length > 0).length;
  }
}
