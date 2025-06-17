import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { PostsService } from '../../../services/posts.service';
import { Post } from '../../../models/post.model';

@Component({
  selector: 'app-sections-ue',
  templateUrl: './sections-ue.component.html',
  styleUrls: ['./sections-ue.component.scss']
})
export class SectionsUeComponent implements OnInit, OnChanges {
  @Input() sectionTitle: string = '';
  @Input() ueId: string = '';

  opened = true;
  posts: Post[] = [];

  constructor(private postsService: PostsService) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.ueId && this.sectionTitle) {
      this.loadPosts();
    }
  }

  private loadPosts() {
    this.postsService.getPostsByUe(this.ueId).subscribe((posts: Post[]) => {
      this.posts = posts.filter(post =>
        post.categorie && post.categorie.trim().toLowerCase() === this.sectionTitle.trim().toLowerCase()
      );
      console.log(this.posts);
    });
  }

  toggleSection() {
    this.opened = !this.opened;
  }
}
