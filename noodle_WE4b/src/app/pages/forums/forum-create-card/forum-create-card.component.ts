import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-forum-create-card',
  templateUrl: './forum-create-card.component.html',
  styleUrls: ['./forum-create-card.component.scss']
})
export class ForumCreateCardComponent {
  @Input() newTitle: string = '';
  @Input() creating: boolean = false;

  @Output() newTitleChange = new EventEmitter<string>();
  @Output() createForum = new EventEmitter<void>();

  onCreateForum() {
    this.createForum.emit();
  }

  isValidTitle(): boolean {
    return this.newTitle.trim().length > 0;
  }
}
