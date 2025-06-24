import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevoirRenduComponent } from './devoir-rendu.component';

describe('DevoirRenduComponent', () => {
  let component: DevoirRenduComponent;
  let fixture: ComponentFixture<DevoirRenduComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DevoirRenduComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DevoirRenduComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
