import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UeRegisterComponent } from './ue-register.component';

describe('UeRegisterComponent', () => {
  let component: UeRegisterComponent;
  let fixture: ComponentFixture<UeRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UeRegisterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UeRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
