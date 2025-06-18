import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
  selector: 'app-forum-header',
  templateUrl: './forum-header.component.html',
  styleUrls: ['./forum-header.component.scss']
})
export class ForumHeaderComponent implements OnChanges {
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

  ngOnChanges() {
    // Synchroniser le titre local si nécessaire
    if (this.forumDetail?.title && !this.editingForumTitle && this.newForumTitle !== this.forumDetail.title) {
      this.newForumTitle = this.forumDetail.title;
      console.log('Forum title synchronized:', this.newForumTitle);
    }
  }

  onTitleChange() {
    this.newForumTitleChange.emit(this.newForumTitle);
  }

  startEditForumTitle() {
    console.log('Starting forum title edit');
    this.startEditTitle.emit();
  }

  onSaveForumTitle() {
    console.log('Saving forum title:', this.newForumTitle);
    this.saveForumTitle.emit();
  }

  onCancelEditForumTitle() {
    console.log('Cancelling forum title edit');
    this.cancelEditTitle.emit();
  }

  onDeleteForum() {
    console.log('Deleting forum');
    this.deleteForum.emit();
  }
}
