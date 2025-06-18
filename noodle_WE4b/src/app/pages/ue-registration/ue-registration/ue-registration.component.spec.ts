import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UeRegistrationComponent } from './ue-registration.component';

describe('UeRegistrationComponent', () => {
  let component: UeRegistrationComponent;
  let fixture: ComponentFixture<UeRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UeRegistrationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UeRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
