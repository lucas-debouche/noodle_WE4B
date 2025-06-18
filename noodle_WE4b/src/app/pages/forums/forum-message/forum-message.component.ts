import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';

@Component({
  selector: 'app-forum-message',
  templateUrl: './forum-message.component.html',
  styleUrls: ['./forum-message.component.scss']
})
export class ForumMessageComponent implements OnInit, OnChanges {
  @Input() message: any;
  @Input() userCache: { [key: string]: string } = {};
  @Input() canModerate: boolean = false;
  @Input() currentUserId: string = '';
  @Input() editingMessageId: string = '';
  @Input() showReplyFormId: string = '';
  @Input() showRepliesId: string = '';

  @Output() startEdit = new EventEmitter<any>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() saveEdit = new EventEmitter<{messageId: string, text: string}>();
  @Output() deleteMessage = new EventEmitter<string>();
  @Output() toggleReplyForm = new EventEmitter<string>();
  @Output() toggleReplies = new EventEmitter<string>();
  @Output() addReply = new EventEmitter<{messageId: string, text: string}>();
  @Output() editReply = new EventEmitter<any>();
  @Output() deleteReply = new EventEmitter<{messageId: string, replyId: string}>();
  @Output() downloadFile = new EventEmitter<{filename: string, originalName: string}>();

  authorName: string = '';
  relativeTime: string = '';
  isEditing: boolean = false;
  showReplyForm: boolean = false;
  showReplies: boolean = false;
  isAuthor: boolean = false;
  editText: string = '';
  replyText: string = '';

  ngOnInit() {
    this.calculateRelativeTime();
    this.isAuthor = this.message.userId === this.currentUserId;
    this.isEditing = this.editingMessageId === this.message._id;
    this.showReplyForm = this.showReplyFormId === this.message._id;
    this.showReplies = this.showRepliesId === this.message._id;

    if (this.isEditing) {
      this.editText = this.message.message;
    }

    // Mise à jour du nom d'auteur à chaque changement
    this.updateAuthorName();
  }

  ngOnChanges() {
    // Mettre à jour le nom d'auteur quand userCache change
    this.updateAuthorName();
  }

  private updateAuthorName() {
    this.authorName = this.userCache[this.message.userId] || 'Utilisateur anonyme';

    // Si le nom n'est pas encore chargé et qu'on a un userId valide
    if (this.authorName === 'Utilisateur anonyme' && this.message.userId) {
      // Optionnel : émettre un événement pour demander le rechargement du nom
      console.log(`Nom d'utilisateur manquant pour: ${this.message.userId}`);
    }
  }

  private calculateRelativeTime() {
    if (!this.message?.createdAt) {
      this.relativeTime = '';
      return;
    }

    const now = new Date();
    const messageDate = new Date(this.message.createdAt);
    const diffInMs = now.getTime() - messageDate.getTime();
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
      this.relativeTime = messageDate.toLocaleDateString('fr-FR');
    }
  }

  onStartEdit() {
    this.editText = this.message.message;
    this.startEdit.emit(this.message);
  }

  onCancelEdit() {
    this.editText = '';
    this.cancelEdit.emit();
  }

  onSaveEdit() {
    if (this.hasEditContent()) {
      this.saveEdit.emit({
        messageId: this.message._id,
        text: this.editText
      });
    }
  }

  onDeleteMessage() {
    this.deleteMessage.emit(this.message._id);
  }

  onToggleReplyForm() {
    this.toggleReplyForm.emit(this.message._id);
  }

  onToggleReplies() {
    this.toggleReplies.emit(this.message._id);
  }

  onAddReply() {
    if (this.hasReplyContent()) {
      this.addReply.emit({
        messageId: this.message._id,
        text: this.replyText
      });
      this.replyText = '';
    }
  }

  onEditReply(reply: any) {
    this.editReply.emit(reply);
  }

  onDeleteReply(event: {replyId: string}) {
    this.deleteReply.emit({
      messageId: this.message._id,
      replyId: event.replyId
    });
  }

  onDownloadFile(event: {filename: string, originalName: string}) {
    this.downloadFile.emit(event);
  }

  hasEditContent(): boolean {
    return this.editText.trim().length > 0;
  }

  hasReplyContent(): boolean {
    return this.replyText.trim().length > 0;
  }

  trackByReplyId(index: number, reply: any): any {
    return reply._id || index;
  }
}
