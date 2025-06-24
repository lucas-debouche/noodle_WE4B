import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RendusModalComponent } from './rendus-modal.component';

describe('RendusModalComponent', () => {
  let component: RendusModalComponent;
  let fixture: ComponentFixture<RendusModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RendusModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RendusModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
