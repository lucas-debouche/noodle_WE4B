import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { PostsService } from '../services/posts.service';
import { Post } from '../models/post.model';

@Component({
  selector: 'app-modules-ue',
  templateUrl: './modules-ue.component.html',
  styleUrls: ['./modules-ue.component.scss']
})
export class ModulesUeComponent implements OnInit, AfterViewInit {
  @Input() module: any;
  posts: Post[] = [];

  opened = false; // <-- fermé par défaut
  contentHeight = 0;

  @ViewChild('contentWrapper') contentWrapper!: ElementRef;
  @ViewChild('content') content!: ElementRef;

  constructor(private postsService: PostsService) { }

  ngOnInit(): void {
    if (!this.module.description) {
      this.module.description = '';
    }
    if (!this.module.resources) {
      this.module.resources = [];
    }
    this.postsService.getPosts().subscribe(posts => {
      this.posts = posts.filter(post => post.ue === this.module.id || post.ue === this.module.name);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateContentHeight());
  }

  toggleModule() {
    this.opened = !this.opened;
    setTimeout(() => this.updateContentHeight());
  }

  updateContentHeight() {
    if (this.opened && this.content) {
      this.contentHeight = this.content.nativeElement.scrollHeight;
    } else {
      this.contentHeight = 0;
    }
  }
}
