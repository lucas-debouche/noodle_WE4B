import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumEmptyStateComponent } from './forum-empty-state.component';

describe('ForumEmptyStateComponent', () => {
  let component: ForumEmptyStateComponent;
  let fixture: ComponentFixture<ForumEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForumEmptyStateComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumEmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit clearSearch event', () => {
    spyOn(component.clearSearch, 'emit');
    component.onClearSearch();
    expect(component.clearSearch.emit).toHaveBeenCalled();
  });

  it('should emit createFirstForum event', () => {
    spyOn(component.createFirstForum, 'emit');
    component.onCreateFirstForum();
    expect(component.createFirstForum.emit).toHaveBeenCalled();
  });
});
