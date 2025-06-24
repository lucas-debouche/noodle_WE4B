import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-forum-filters-card',
  templateUrl: './forum-filters-card.component.html',
  styleUrls: ['./forum-filters-card.component.scss']
})
export class ForumFiltersCardComponent {
  @Input() searchTerm: string = '';
  @Input() sortBy: string = 'recent';
  @Input() forumsCount: number = 0;

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() sortByChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() sortChange = new EventEmitter<void>();
  @Output() clearSearch = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();

  sortOptions = [
    { value: 'recent', label: 'Plus récents' },
    { value: 'oldest', label: 'Plus anciens' },
    { value: 'messages', label: 'Plus de messages' },
    { value: 'title', label: 'Titre A-Z' }
  ];

  onSearchChange() {
    this.searchTermChange.emit(this.searchTerm);
    this.searchChange.emit();
  }

  onSortChange() {
    this.sortByChange.emit(this.sortBy);
    this.sortChange.emit();
  }

  onClearSearch() {
    this.searchTerm = '';
    this.searchTermChange.emit(this.searchTerm);
    this.clearSearch.emit();
  }

  onResetFilters() {
    this.resetFilters.emit();
  }
}
