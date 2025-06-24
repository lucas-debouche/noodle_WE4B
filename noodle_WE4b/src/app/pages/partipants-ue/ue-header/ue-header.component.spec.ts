import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UeHeaderComponent } from './ue-header.component';

describe('UeHeaderComponent', () => {
  let component: UeHeaderComponent;
  let fixture: ComponentFixture<UeHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UeHeaderComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UeHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
