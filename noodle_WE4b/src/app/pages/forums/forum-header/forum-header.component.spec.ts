import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumHeaderComponent } from './forum-header.component';

describe('ForumHeaderComponent', () => {
  let component: ForumHeaderComponent;
  let fixture: ComponentFixture<ForumHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForumHeaderComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumHeaderComponent);
    component = fixture.componentInstance;
    component.forumDetail = {
      title: 'Test Forum',
      createdAt: new Date().toISOString()
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit startEditTitle event', () => {
    spyOn(component.startEditTitle, 'emit');
    component.startEditForumTitle();
    expect(component.startEditTitle.emit).toHaveBeenCalled();
  });

  it('should emit saveForumTitle event', () => {
    spyOn(component.saveForumTitle, 'emit');
    component.onSaveForumTitle();
    expect(component.saveForumTitle.emit).toHaveBeenCalled();
  });

  it('should emit cancelEditTitle event', () => {
    spyOn(component.cancelEditTitle, 'emit');
    component.onCancelEditForumTitle();
    expect(component.cancelEditTitle.emit).toHaveBeenCalled();
  });

  it('should emit deleteForum event', () => {
    spyOn(component.deleteForum, 'emit');
    component.onDeleteForum();
    expect(component.deleteForum.emit).toHaveBeenCalled();
  });
});
