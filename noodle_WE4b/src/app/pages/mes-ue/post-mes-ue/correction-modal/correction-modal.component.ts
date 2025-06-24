import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-correction-modal',
  templateUrl: './correction-modal.component.html',
  styleUrls: ['./correction-modal.component.scss']
})
export class CorrectionModalComponent {
  @Input() rendu: any;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
