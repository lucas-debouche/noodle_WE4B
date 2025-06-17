import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionsUeComponent } from './sections-ue.component';

describe('SectionsUeComponent', () => {
  let component: SectionsUeComponent;
  let fixture: ComponentFixture<SectionsUeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SectionsUeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionsUeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
