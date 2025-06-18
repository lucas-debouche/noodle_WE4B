import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';

@Component({
  selector: 'app-forum-reply',
  templateUrl: './forum-reply.component.html',
  styleUrls: ['./forum-reply.component.scss']
})
export class ForumReplyComponent implements OnInit, OnChanges {
  @Input() reply: any;
  @Input() messageId: string = '';
  @Input() userCache: { [key: string]: string } = {};
  @Input() canModerate: boolean = false;
  @Input() currentUserId: string = '';
  @Input() editingReplyId: string = '';
  @Input() editText: string = '';

  @Output() editReply = new EventEmitter<any>();
  @Output() deleteReply = new EventEmitter<{replyId: string}>();
  @Output() downloadFile = new EventEmitter<{filename: string, originalName: string}>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() saveEdit = new EventEmitter<{replyId: string, text: string}>();
  @Output() editTextChange = new EventEmitter<string>();

  authorName: string = '';
  relativeTime: string = '';
  isEditing: boolean = false;
  isAuthor: boolean = false;

  ngOnInit() {
    this.calculateRelativeTime();
    this.updateAuthorStatus();
    this.updateEditingState();
    this.updateAuthorName();

  }

  ngOnChanges() {
    this.updateAuthorName();
    this.updateAuthorStatus();
    this.updateEditingState();
  }

  private updateAuthorStatus() {
    this.isAuthor = this.reply.userId === this.currentUserId && !!this.currentUserId;
  }

  private updateEditingState() {
    const wasEditing = this.isEditing;
    this.isEditing = this.editingReplyId === this.reply._id;

  }

  private updateAuthorName() {
    this.authorName = this.userCache[this.reply.userId] || 'Utilisateur anonyme';

    if (this.authorName === 'Utilisateur anonyme' && this.reply.userId) {
    }
  }

  private calculateRelativeTime() {
    if (!this.reply?.createdAt) {
      this.relativeTime = '';
      return;
    }

    const now = new Date();
    const replyDate = new Date(this.reply.createdAt);
    const diffInMs = now.getTime() - replyDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      this.relativeTime = 'À l\'instant';
    } else if (diffInMinutes < 60) {
      this.relativeTime = `Il y a ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      this.relativeTime = `Il y a ${diffInHours}h`;
    } else if (diffInDays === 1) {
      this.relativeTime = 'Hier';
    } else if (diffInDays < 7) {
      this.relativeTime = `Il y a ${diffInDays} jours`;
    } else {
      this.relativeTime = replyDate.toLocaleDateString('fr-FR');
    }
  }

  onStartEdit() {
    this.editReply.emit(this.reply);
  }

  onCancelEdit() {
    this.cancelEdit.emit();
  }

  onSaveEdit() {
    if (this.hasEditContent()) {
      this.saveEdit.emit({
        replyId: this.reply._id,
        text: this.editText
      });
    }
  }

  onDeleteReply() {
    this.deleteReply.emit({
      replyId: this.reply._id
    });
  }

  onDownloadFile(event: {filename: string, originalName: string}) {
    this.downloadFile.emit(event);
  }


  onEditTextChange(newText: string) {
    this.editTextChange.emit(newText);
  }

  hasEditContent(): boolean {
    return this.editText.trim().length > 0;
  }
}
