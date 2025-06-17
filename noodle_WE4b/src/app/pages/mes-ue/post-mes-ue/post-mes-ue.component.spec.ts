import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostMesUeComponent } from './post-mes-ue.component';

describe('PostMesUeComponent', () => {
  let component: PostMesUeComponent;
  let fixture: ComponentFixture<PostMesUeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PostMesUeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PostMesUeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
