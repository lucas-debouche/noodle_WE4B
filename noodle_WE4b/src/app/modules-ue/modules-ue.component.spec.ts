import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModulesUeComponent } from './modules-ue.component';

describe('ModulesUeComponent', () => {
  let component: ModulesUeComponent;
  let fixture: ComponentFixture<ModulesUeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModulesUeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModulesUeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
