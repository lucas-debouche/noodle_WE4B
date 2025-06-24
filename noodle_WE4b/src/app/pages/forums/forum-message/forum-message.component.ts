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
  @Input() editingReplyId: string = '';
  @Input() editText: string = '';
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
  @Output() cancelReplyEdit = new EventEmitter<void>();
  @Output() saveReplyEdit = new EventEmitter<{messageId: string, replyId: string, text: string}>();
  @Output() editTextChange = new EventEmitter<string>();

  authorName: string = '';
  relativeTime: string = '';
  isEditing: boolean = false;
  showReplyForm: boolean = false;
  showReplies: boolean = false;
  isAuthor: boolean = false;
  replyText: string = '';

  ngOnInit() {
    this.calculateRelativeTime();
    this.updateAuthorStatus();
    this.updateEditingState();
    this.showReplyForm = this.showReplyFormId === this.message._id;
    this.showReplies = this.showRepliesId === this.message._id;

    this.updateAuthorName();

    console.log(`Message ${this.message._id} initialized:`, {
      isAuthor: this.isAuthor,
      currentUserId: this.currentUserId,
      messageUserId: this.message.userId,
      isEditing: this.isEditing,
      showReplyForm: this.showReplyForm,
      showReplies: this.showReplies,
      repliesCount: this.message.replies?.length || 0
    });
  }

  ngOnChanges() {
    this.updateAuthorName();
    this.updateAuthorStatus();
    this.updateEditingState();
    this.showReplyForm = this.showReplyFormId === this.message._id;
    this.showReplies = this.showRepliesId === this.message._id;

    // Log pour vérifier que le contenu du message est bien mis à jour
    console.log(`Message ${this.message._id} content update:`, {
      message: this.message.message,
      isEdited: this.message.isEdited,
      isEditing: this.isEditing
    });
  }

  private updateAuthorStatus() {
    this.isAuthor = this.message.userId === this.currentUserId && !!this.currentUserId;
    console.log(`Author status for message ${this.message._id}:`, {
      isAuthor: this.isAuthor,
      messageUserId: this.message.userId,
      currentUserId: this.currentUserId
    });
  }

  private updateEditingState() {
    const wasEditing = this.isEditing;
    this.isEditing = this.editingMessageId === this.message._id;

    if (this.isEditing && !wasEditing) {
      console.log(`Started editing message ${this.message._id}`);
    } else if (!this.isEditing && wasEditing) {
      console.log(`Stopped editing message ${this.message._id}`);
    }
  }

  private updateAuthorName() {
    const previousName = this.authorName;
    this.authorName = this.userCache[this.message.userId] || 'Utilisateur anonyme';

    // Debug: afficher les changements
    if (previousName !== this.authorName) {
      console.log(`Nom mis à jour pour ${this.message.userId}: ${previousName} → ${this.authorName}`);
    }

    // Si le nom n'est pas encore chargé et qu'on a un userId valide
    if (this.authorName === 'Utilisateur anonyme' && this.message.userId) {
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
    this.startEdit.emit(this.message);
  }

  onCancelEdit() {
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
    console.log(`Toggling reply form for message ${this.message._id}`);
    this.toggleReplyForm.emit(this.message._id);
  }

  onToggleReplies() {
    console.log(`Toggling replies for message ${this.message._id}`);
    this.toggleReplies.emit(this.message._id);
  }

  onAddReply() {
    if (this.hasReplyContent()) {
      console.log(`Adding reply to message ${this.message._id}:`, this.replyText);
      this.addReply.emit({
        messageId: this.message._id,
        text: this.replyText
      });
      this.replyText = '';
    }
  }

  onReplyKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onAddReply();
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

  getEditingReplyId(replyId: string): string {
    return this.editingReplyId === replyId ? replyId : '';
  }

  onCancelReplyEdit() {
    this.cancelReplyEdit.emit();
  }

  onSaveReplyEdit(event: {replyId: string, text: string}) {
    this.saveReplyEdit.emit({
      messageId: this.message._id,
      replyId: event.replyId,
      text: event.text
    });
  }

  onEditTextChange(newText: string) {
    this.editTextChange.emit(newText);
  }

  hasEditContent(): boolean {
    return  this.editText.trim().length > 0;
  }

  hasReplyContent(): boolean {
    return this.replyText.trim().length > 0;
  }

  trackByReplyId(index: number, reply: any): any {
    return reply._id || index;
  }
}
