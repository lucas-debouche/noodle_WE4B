import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRolesUesComponent } from './user-roles-ues.component';

describe('UserRolesUesComponent', () => {
  let component: UserRolesUesComponent;
  let fixture: ComponentFixture<UserRolesUesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserRolesUesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserRolesUesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
