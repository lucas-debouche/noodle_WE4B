import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UesListComponent } from './ues-list.component';

describe('UesListComponent', () => {
  let component: UesListComponent;
  let fixture: ComponentFixture<UesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UesListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
