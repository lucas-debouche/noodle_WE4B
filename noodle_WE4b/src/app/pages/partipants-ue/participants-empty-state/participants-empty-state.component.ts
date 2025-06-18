import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-participants-empty-state',
  templateUrl: './participants-empty-state.component.html',
  styleUrls: ['./participants-empty-state.component.scss']
})
export class ParticipantsEmptyStateComponent {
  @Input() loading: boolean = false;
  @Input() error: string = '';
  @Input() totalVisibleParticipants: number = 0;
  @Input() hasActiveFilters: boolean = false;

  @Output() refreshData = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();

  onRefreshData() {
    this.refreshData.emit();
  }

  onResetFilters() {
    this.resetFilters.emit();
  }
}
