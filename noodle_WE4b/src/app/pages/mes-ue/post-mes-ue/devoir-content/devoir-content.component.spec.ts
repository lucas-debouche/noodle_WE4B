import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevoirContentComponent } from './devoir-content.component';

describe('DevoirContentComponent', () => {
  let component: DevoirContentComponent;
  let fixture: ComponentFixture<DevoirContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DevoirContentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DevoirContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
