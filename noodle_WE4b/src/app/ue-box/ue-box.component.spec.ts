import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UeBoxComponent } from './ue-box.component';

describe('UeBoxComponent', () => {
  let component: UeBoxComponent;
  let fixture: ComponentFixture<UeBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UeBoxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UeBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
