import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumMessageComponent } from './forum-message.component';

describe('ForumMessageComponent', () => {
  let component: ForumMessageComponent;
  let fixture: ComponentFixture<ForumMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForumMessageComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumMessageComponent);
    component = fixture.componentInstance;
    component.message = {
      _id: '1',
      message: 'Test message',
      userId: 'user1',
      createdAt: new Date().toISOString(),
      replies: []
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

  it('should validate reply content', () => {
    component.replyText = '';
    expect(component.hasReplyContent()).toBeFalsy();

    component.replyText = 'Some reply';
    expect(component.hasReplyContent()).toBeTruthy();
  });

  it('should emit deleteMessage event', () => {
    spyOn(component.deleteMessage, 'emit');
    component.onDeleteMessage();
    expect(component.deleteMessage.emit).toHaveBeenCalledWith('1');
  });

  it('should emit saveEdit event with correct data', () => {
    spyOn(component.saveEdit, 'emit');
    component.editText = 'Updated message';
    component.onSaveEdit();
    expect(component.saveEdit.emit).toHaveBeenCalledWith({
      messageId: '1',
      text: 'Updated message'
    });
  });
});
