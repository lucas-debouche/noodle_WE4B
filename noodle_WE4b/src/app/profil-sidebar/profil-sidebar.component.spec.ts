import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilSidebarComponent } from './profil-sidebar.component';

describe('ProfilSidebarComponent', () => {
  let component: ProfilSidebarComponent;
  let fixture: ComponentFixture<ProfilSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProfilSidebarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
