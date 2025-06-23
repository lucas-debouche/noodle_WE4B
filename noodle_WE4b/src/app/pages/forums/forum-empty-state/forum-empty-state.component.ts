import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-forum-empty-state',
  templateUrl: './forum-empty-state.component.html',
  styleUrls: ['./forum-empty-state.component.scss']
})
export class ForumEmptyStateComponent {
  @Input() searchTerm: string = '';

  @Output() clearSearch = new EventEmitter<void>();
  @Output() createFirstForum = new EventEmitter<void>();

  onClearSearch() {
    this.clearSearch.emit();
  }

  onCreateFirstForum() {
    this.createFirstForum.emit();
  }
}
