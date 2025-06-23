import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumFiltersCardComponent } from './forum-filters-card.component';

describe('ForumFiltersCardComponent', () => {
  let component: ForumFiltersCardComponent;
  let fixture: ComponentFixture<ForumFiltersCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForumFiltersCardComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumFiltersCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit searchChange when search term changes', () => {
    spyOn(component.searchChange, 'emit');
    spyOn(component.searchTermChange, 'emit');

    component.searchTerm = 'test';
    component.onSearchChange();

    expect(component.searchTermChange.emit).toHaveBeenCalledWith('test');
    expect(component.searchChange.emit).toHaveBeenCalled();
  });

  it('should emit sortChange when sort changes', () => {
    spyOn(component.sortChange, 'emit');
    spyOn(component.sortByChange, 'emit');

    component.sortBy = 'title';
    component.onSortChange();

    expect(component.sortByChange.emit).toHaveBeenCalledWith('title');
    expect(component.sortChange.emit).toHaveBeenCalled();
  });

  it('should clear search and emit events', () => {
    spyOn(component.clearSearch, 'emit');
    spyOn(component.searchTermChange, 'emit');

    component.searchTerm = 'test';
    component.onClearSearch();

    expect(component.searchTerm).toBe('');
    expect(component.searchTermChange.emit).toHaveBeenCalledWith('');
    expect(component.clearSearch.emit).toHaveBeenCalled();
  });
});
