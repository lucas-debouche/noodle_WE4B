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

  @Output() editReply = new EventEmitter<any>();
  @Output() deleteReply = new EventEmitter<{replyId: string}>();
  @Output() downloadFile = new EventEmitter<{filename: string, originalName: string}>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() saveEdit = new EventEmitter<{replyId: string, text: string}>();

  authorName: string = '';
  relativeTime: string = '';
  isEditing: boolean = false;
  isAuthor: boolean = false;
  editText: string = '';

  ngOnInit() {
    this.calculateRelativeTime();
    this.isAuthor = this.reply.userId === this.currentUserId;
    this.isEditing = this.editingReplyId === this.reply._id;

    if (this.isEditing) {
      this.editText = this.reply.message;
    }

    this.updateAuthorName();
  }

  ngOnChanges() {
    this.updateAuthorName();
  }

  private updateAuthorName() {
    this.authorName = this.userCache[this.reply.userId] || 'Utilisateur anonyme';

    if (this.authorName === 'Utilisateur anonyme' && this.reply.userId) {
      console.log(`Nom d'utilisateur manquant pour la réponse: ${this.reply.userId}`);
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
    this.editText = this.reply.message;
    this.editReply.emit(this.reply);
  }

  onCancelEdit() {
    this.editText = '';
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

  hasEditContent(): boolean {
    return this.editText.trim().length > 0;
  }
}
