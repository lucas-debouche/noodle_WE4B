import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumDiscussionCardComponent } from './forum-discussion-card.component';

describe('ForumDiscussionCardComponent', () => {
  let component: ForumDiscussionCardComponent;
  let fixture: ComponentFixture<ForumDiscussionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForumDiscussionCardComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumDiscussionCardComponent);
    component = fixture.componentInstance;
    component.forum = {
      _id: '1',
      title: 'Test Forum',
      createdAt: new Date().toISOString(),
      messages: []
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate message count correctly', () => {
    component.forum = {
      _id: '1',
      title: 'Test',
      messages: [{ userId: '1' }, { userId: '2' }]
    };
    component.ngOnInit();
    expect(component.messageCount).toBe(2);
  });

  it('should calculate participant count correctly', () => {
    component.forum = {
      _id: '1',
      title: 'Test',
      messages: [
        { userId: '1' },
        { userId: '2' },
        { userId: '1' } // Duplicate user
      ]
    };
    component.ngOnInit();
    expect(component.participantCount).toBe(2);
  });
});
