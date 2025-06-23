import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-forum-message-form',
  templateUrl: './forum-message-form.component.html',
  styleUrls: ['./forum-message-form.component.scss']
})
export class ForumMessageFormComponent {
  @Input() newMessage: string = '';
  @Input() isSending: boolean = false;
  @Input() showEmojiPicker: boolean = false;
  @Input() currentUserName: string = '';
  @Input() selectedFilesArray: File[] = [];

  @Output() newMessageChange = new EventEmitter<string>();
  @Output() submitMessage = new EventEmitter<void>();
  @Output() clearMessage = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<Event>();
  @Output() removeFile = new EventEmitter<number>();
  @Output() toggleEmojiPicker = new EventEmitter<void>();
  @Output() addEmoji = new EventEmitter<string>();
  @Output() updateCharCount = new EventEmitter<void>();

  onSubmitMessage() {
    if (this.hasMessageContent() && !this.isSending) {
      this.submitMessage.emit();
    }
  }

  onClearMessage() {
    this.clearMessage.emit();
  }

  onFileSelected(event: Event) {
    this.fileSelected.emit(event);
  }

  onRemoveFile(index: number) {
    this.removeFile.emit(index);
  }

  onToggleEmojiPicker() {
    this.toggleEmojiPicker.emit();
  }

  onAddEmoji(emoji: string) {
    this.newMessage += emoji;
    this.newMessageChange.emit(this.newMessage);
    this.addEmoji.emit(emoji);
  }

  // Ajout d'une méthode pour synchroniser les changements du textarea
  onMessageChange() {
    this.newMessageChange.emit(this.newMessage);
  }

  onUpdateCharCount() {
    this.updateCharCount.emit();
  }

  hasMessageContent(): boolean {
    return this.newMessage.trim().length > 0;
  }

  getCharCount(): number {
    return this.newMessage ? this.newMessage.length : 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(mimeType: string): string {
    if (!mimeType) return '📄';

    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📕';
    if (mimeType.includes('word')) return '📘';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📗';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📙';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
    if (mimeType === 'text/plain') return '📄';

    return '📎';
  }
}
