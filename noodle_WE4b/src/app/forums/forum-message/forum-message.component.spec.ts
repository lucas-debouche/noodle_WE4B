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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
