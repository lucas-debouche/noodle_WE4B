import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Ue } from '../../../../../models/ue.model';

@Component({
  selector: 'app-ue-card',
  templateUrl: './ue-card.component.html',
  styleUrls: ['./ue-card.component.scss']
})
export class UeCardComponent {
  @Input() ue!: Ue;
  @Input() isEditing = false;

  @Output() edit = new EventEmitter<Ue>();
  @Output() delete = new EventEmitter<Ue>();

  onEdit() {
    this.edit.emit(this.ue);
  }

  onDelete() {
    this.delete.emit(this.ue);
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `http://localhost:3000/uploads/ue/${imagePath}`;
  }

  getParticipantCount(): number {
    return this.ue.participants ? this.ue.participants.length : 0;
  }

  formatCreatedDate(): string {
    if (!this.ue.createdAt) return '';
    return new Date(this.ue.createdAt).toLocaleDateString('fr-FR');
  }

  truncateDescription(description: string, maxLength: number = 100): string {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  }
}
