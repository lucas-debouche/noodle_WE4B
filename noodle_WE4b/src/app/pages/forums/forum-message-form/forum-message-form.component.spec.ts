import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumMessageFormComponent } from './forum-message-form.component';

describe('ForumMessageFormComponent', () => {
  let component: ForumMessageFormComponent;
  let fixture: ComponentFixture<ForumMessageFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForumMessageFormComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumMessageFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate message content correctly', () => {
    component.newMessage = '';
    expect(component.hasMessageContent()).toBeFalsy();

    component.newMessage = '   ';
    expect(component.hasMessageContent()).toBeFalsy();

    component.newMessage = 'Valid message';
    expect(component.hasMessageContent()).toBeTruthy();
  });

  it('should count characters correctly', () => {
    component.newMessage = 'Hello';
    expect(component.getCharCount()).toBe(5);

    component.newMessage = '';
    expect(component.getCharCount()).toBe(0);
  });

  it('should format file size correctly', () => {
    expect(component.formatFileSize(0)).toBe('0 B');
    expect(component.formatFileSize(1024)).toBe('1 KB');
    expect(component.formatFileSize(1048576)).toBe('1 MB');
  });

  it('should get correct file icon', () => {
    expect(component.getFileIcon('image/jpeg')).toBe('🖼️');
    expect(component.getFileIcon('application/pdf')).toBe('📕');
    expect(component.getFileIcon('')).toBe('📄');
  });

  it('should emit submitMessage when form is submitted', () => {
    spyOn(component.submitMessage, 'emit');
    component.newMessage = 'Test message';
    component.onSubmitMessage();
    expect(component.submitMessage.emit).toHaveBeenCalled();
  });

  it('should add emoji to message', () => {
    spyOn(component.newMessageChange, 'emit');
    spyOn(component.addEmoji, 'emit');

    component.newMessage = 'Hello ';
    component.onAddEmoji('😊');

    expect(component.newMessage).toBe('Hello 😊');
    expect(component.newMessageChange.emit).toHaveBeenCalledWith('Hello 😊');
    expect(component.addEmoji.emit).toHaveBeenCalledWith('😊');
  });
});
