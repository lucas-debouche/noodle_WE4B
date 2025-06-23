import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantsGridComponent } from './participants-grid.component';

describe('ParticipantsGridComponent', () => {
  let component: ParticipantsGridComponent;
  let fixture: ComponentFixture<ParticipantsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParticipantsGridComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
