import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesUeComponent } from './mes-ue.component';

describe('MesUeComponent', () => {
  let component: MesUeComponent;
  let fixture: ComponentFixture<MesUeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MesUeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MesUeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
