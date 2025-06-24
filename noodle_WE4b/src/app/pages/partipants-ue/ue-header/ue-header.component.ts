import { Component, Input } from '@angular/core';
import { Ue } from '../../../models/ue.model';

@Component({
  selector: 'app-ue-header',
  templateUrl: './ue-header.component.html',
  styleUrls: ['./ue-header.component.scss']
})
export class UeHeaderComponent {
  @Input() ueInfo: Ue | null = null;
  @Input() totalParticipants: number = 0;
  @Input() totalEtudiants: number = 0;
  @Input() totalProfesseurs: number = 0;
}
