import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ParticipantWithUeInfo } from '../../../models/participant-ue.model';

@Component({
  selector: 'app-participants-grid',
  templateUrl: './participants-grid.component.html',
  styleUrls: ['./participants-grid.component.scss']
})
export class ParticipantsGridComponent {
  @Input() visibleEtudiants: ParticipantWithUeInfo[] = [];
  @Input() visibleProfesseurs: ParticipantWithUeInfo[] = [];

  @Output() refreshData = new EventEmitter<void>();

  onRefreshData() {
    this.refreshData.emit();
  }

  trackByParticipantId(index: number, participant: ParticipantWithUeInfo): string {
    return participant._id;
  }
}
