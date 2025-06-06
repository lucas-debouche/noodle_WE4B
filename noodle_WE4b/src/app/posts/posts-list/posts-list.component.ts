import { Component, OnInit } from '@angular/core';
import { PostsService } from '../posts.service';
import { Post } from '../../shared/models/post.model';

@Component({
  selector: 'app-posts-list',
  templateUrl: './posts-list.component.html',
  styleUrls: ['./posts-list.component.scss'],
})
export class PostsListComponent implements OnInit {
  posts: Post[] = [];

  constructor(private postsService: PostsService) {}

  ngOnInit() {
    this.postsService.getAllPosts().subscribe({
      next: (data) => (this.posts = data),
      error: (err) => console.error('Failed to load posts', err),
    });
  }
}
