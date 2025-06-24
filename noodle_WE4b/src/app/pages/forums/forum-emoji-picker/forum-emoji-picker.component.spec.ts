import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumEmojiPickerComponent } from './forum-emoji-picker.component';

describe('ForumEmojiPickerComponent', () => {
  let component: ForumEmojiPickerComponent;
  let fixture: ComponentFixture<ForumEmojiPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForumEmojiPickerComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumEmojiPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle emoji picker', () => {
    spyOn(component.showEmojiPickerChange, 'emit');
    spyOn(component.toggleEmojiPicker, 'emit');

    component.showEmojiPicker = false;
    component.onToggleEmojiPicker();

    expect(component.showEmojiPicker).toBeTruthy();
    expect(component.showEmojiPickerChange.emit).toHaveBeenCalledWith(true);
    expect(component.toggleEmojiPicker.emit).toHaveBeenCalled();
  });

  it('should add emoji and close picker', () => {
    spyOn(component.addEmoji, 'emit');
    spyOn(component.showEmojiPickerChange, 'emit');

    component.showEmojiPicker = true;
    component.onAddEmoji('😊');

    expect(component.addEmoji.emit).toHaveBeenCalledWith('😊');
    expect(component.showEmojiPicker).toBeFalsy();
    expect(component.showEmojiPickerChange.emit).toHaveBeenCalledWith(false);
  });

  it('should have common emojis', () => {
    expect(component.commonEmojis.length).toBeGreaterThan(0);
    expect(component.commonEmojis).toContain('😊');
  });
});
