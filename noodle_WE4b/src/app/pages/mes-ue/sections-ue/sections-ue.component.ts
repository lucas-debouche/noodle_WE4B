import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
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

  @Output() postsLoaded = new EventEmitter<Post[]>();
  @Output() faitChange = new EventEmitter<{index: number, value: boolean}>();

  opened = true;
  posts: Post[] = [];
  faitStates: boolean[] = [];

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
      this.faitStates = this.posts.map(() => false);
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
