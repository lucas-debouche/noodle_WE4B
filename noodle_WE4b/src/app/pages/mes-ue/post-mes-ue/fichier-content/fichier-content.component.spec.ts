import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FichierContentComponent } from './fichier-content.component';

describe('FichierContentComponent', () => {
  let component: FichierContentComponent;
  let fixture: ComponentFixture<FichierContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FichierContentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FichierContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
