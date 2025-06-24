import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePostUeComponent } from './create-post-ue.component';

describe('CreatePostUeComponent', () => {
  let component: CreatePostUeComponent;
  let fixture: ComponentFixture<CreatePostUeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreatePostUeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePostUeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
