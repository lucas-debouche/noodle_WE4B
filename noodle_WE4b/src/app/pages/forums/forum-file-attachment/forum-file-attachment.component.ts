import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-forum-file-attachment',
  templateUrl: './forum-file-attachment.component.html',
  styleUrls: ['./forum-file-attachment.component.scss']
})
export class ForumFileAttachmentComponent {
  @Input() attachments: any[] = [];
  @Input() isReply: boolean = false;

  @Output() downloadFile = new EventEmitter<{filename: string, originalName: string}>();

  onDownloadFile(filename: string, originalName: string) {
    this.downloadFile.emit({ filename, originalName });
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

  isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  getImageUrl(filename: string): string {
    return `http://localhost:3000/uploads/forums/${filename}`;
  }
}
