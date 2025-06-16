import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, AfterViewChecked } from '@angular/core';
import { PostsService } from '../services/posts.service';
import { Post } from '../models/post.model';

@Component({
  selector: 'app-modules-ue',
  templateUrl: './modules-ue.component.html',
  styleUrls: ['./modules-ue.component.scss']
})
export class ModulesUeComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @Input() module: any;
  posts: Post[] = [];

  opened = false;
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
      // Met à jour la hauteur si les posts changent
      setTimeout(() => this.updateContentHeight());
    });
  }

  ngAfterViewInit(): void {
    this.updateContentHeight();
  }

  ngAfterViewChecked(): void {
    // Met à jour la hauteur si le contenu change (ex: ouverture d'un post)
    if (this.opened) {
      this.updateContentHeight();
    }
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
