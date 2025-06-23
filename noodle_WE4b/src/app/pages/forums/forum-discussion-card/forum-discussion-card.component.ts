import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-forum-discussion-card',
  templateUrl: './forum-discussion-card.component.html',
  styleUrls: ['./forum-discussion-card.component.scss']
})
export class ForumDiscussionCardComponent implements OnInit {
  @Input() forum: any;

  messageCount: number = 0;
  participantCount: number = 0;
  relativeTime: string = '';

  ngOnInit() {
    this.calculateCounts();
    this.calculateRelativeTime();
  }

  private calculateCounts() {
    this.messageCount = this.forum?.messages?.length || this.forum?.messageCount || 0;

    // Calculate participant count
    const participants = new Set();
    this.forum?.messages?.forEach((message: any) => {
      if (message.userId) {
        participants.add(message.userId);
      }
    });
    this.participantCount = participants.size;
  }

  private calculateRelativeTime() {
    if (!this.forum?.createdAt) {
      this.relativeTime = '';
      return;
    }

    const now = new Date();
    const forumDate = new Date(this.forum.createdAt);
    const diffInMs = now.getTime() - forumDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        this.relativeTime = diffInMinutes <= 1 ? 'À l\'instant' : `Il y a ${diffInMinutes} min`;
      } else {
        this.relativeTime = `Il y a ${diffInHours}h`;
      }
    } else if (diffInDays === 1) {
      this.relativeTime = 'Hier';
    } else if (diffInDays < 7) {
      this.relativeTime = `Il y a ${diffInDays} jours`;
    } else {
      this.relativeTime = forumDate.toLocaleDateString('fr-FR');
    }
  }
}
