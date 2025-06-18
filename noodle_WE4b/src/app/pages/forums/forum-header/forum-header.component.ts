import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-forum-header',
  templateUrl: './forum-header.component.html',
  styleUrls: ['./forum-header.component.scss']
})
export class ForumHeaderComponent {
  @Input() forumDetail: any;
  @Input() editingForumTitle: boolean = false;
  @Input() newForumTitle: string = '';
  @Input() canModerate: boolean = false;
  @Input() canDeleteForum: boolean = false;
  @Input() messagesCount: number = 0;

  @Output() newForumTitleChange = new EventEmitter<string>();
  @Output() startEditTitle = new EventEmitter<void>();
  @Output() saveForumTitle = new EventEmitter<void>();
  @Output() cancelEditTitle = new EventEmitter<void>();
  @Output() deleteForum = new EventEmitter<void>();

  startEditForumTitle() {
    this.startEditTitle.emit();
  }

  onSaveForumTitle() {
    this.saveForumTitle.emit();
  }

  onCancelEditForumTitle() {
    this.cancelEditTitle.emit();
  }

  onDeleteForum() {
    this.deleteForum.emit();
  }
}
