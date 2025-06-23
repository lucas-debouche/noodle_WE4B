import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantsFiltersComponent } from './participants-filters.component';

describe('ParticipantsFiltersComponent', () => {
  let component: ParticipantsFiltersComponent;
  let fixture: ComponentFixture<ParticipantsFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParticipantsFiltersComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantsFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
