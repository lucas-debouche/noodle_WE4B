import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-forum-emoji-picker',
  templateUrl: './forum-emoji-picker.component.html',
  styleUrls: ['./forum-emoji-picker.component.scss']
})
export class ForumEmojiPickerComponent {
  @Input() showEmojiPicker: boolean = false;

  @Output() showEmojiPickerChange = new EventEmitter<boolean>();
  @Output() addEmoji = new EventEmitter<string>();
  @Output() toggleEmojiPicker = new EventEmitter<void>();

  commonEmojis: string[] = [
    '😊', '😍', '🤔', '👍', '👎', '❤️', '😂', '😢',
    '😮', '😡', '🙏', '👏', '🔥', '💯', '✅', '❌',
    '🎉', '🎈', '🌟', '✨', '💔', '😎', '🤗', '🤷‍♂️',
    '🤷‍♀️', '🙌', '💪', '👀', '🤩', '😴', '😜', '😅',
    '😇', '🤓', '😏', '😋', '🤤', '😬', '😱', '🤯'
  ];

  onToggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    this.showEmojiPickerChange.emit(this.showEmojiPicker);
    this.toggleEmojiPicker.emit();
  }

  onAddEmoji(emoji: string) {
    this.addEmoji.emit(emoji);
    this.showEmojiPicker = false;
    this.showEmojiPickerChange.emit(this.showEmojiPicker);
  }
}
