import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Admin_panelComponent } from './admin_panel.component';

describe('Admin_panelComponent', () => {
  let component: Admin_panelComponent;
  let fixture: ComponentFixture<Admin_panelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Admin_panelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Admin_panelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
