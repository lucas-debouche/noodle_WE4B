import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumReplyComponent } from './forum-reply.component';

describe('ForumReplyComponent', () => {
  let component: ForumReplyComponent;
  let fixture: ComponentFixture<ForumReplyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForumReplyComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumReplyComponent);
    component = fixture.componentInstance;
    component.reply = {
      _id: '1',
      message: 'Test reply',
      userId: 'user1',
      createdAt: new Date().toISOString()
    };
    component.userCache = { 'user1': 'John Doe' };
    component.currentUserId = 'user1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should identify author correctly', () => {
    expect(component.isAuthor).toBeTruthy();
  });

  it('should validate edit content', () => {
    component.editText = '';
    expect(component.hasEditContent()).toBeFalsy();

    component.editText = 'Some text';
    expect(component.hasEditContent()).toBeTruthy();
  });

  it('should emit deleteReply event', () => {
    spyOn(component.deleteReply, 'emit');
    component.onDeleteReply();
    expect(component.deleteReply.emit).toHaveBeenCalledWith({
      replyId: '1'
    });
  });

  it('should emit saveEdit event with correct data', () => {
    spyOn(component.saveEdit, 'emit');
    component.editText = 'Updated reply';
    component.onSaveEdit();
    expect(component.saveEdit.emit).toHaveBeenCalledWith({
      replyId: '1',
      text: 'Updated reply'
    });
  });
});
