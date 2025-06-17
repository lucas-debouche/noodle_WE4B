import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarMesUeComponent } from './sidebar-mes-ue.component';

describe('SidebarMesUeComponent', () => {
  let component: SidebarMesUeComponent;
  let fixture: ComponentFixture<SidebarMesUeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SidebarMesUeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarMesUeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
