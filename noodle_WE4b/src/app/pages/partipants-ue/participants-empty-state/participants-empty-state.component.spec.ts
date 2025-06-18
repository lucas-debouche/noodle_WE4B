import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantsEmptyStateComponent } from './participants-empty-state.component';

describe('ParticipantsEmptyStateComponent', () => {
  let component: ParticipantsEmptyStateComponent;
  let fixture: ComponentFixture<ParticipantsEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParticipantsEmptyStateComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantsEmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
