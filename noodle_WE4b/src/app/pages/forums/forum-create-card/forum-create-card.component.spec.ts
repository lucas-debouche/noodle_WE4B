import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumCreateCardComponent } from './forum-create-card.component';

describe('ForumCreateCardComponent', () => {
  let component: ForumCreateCardComponent;
  let fixture: ComponentFixture<ForumCreateCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForumCreateCardComponent ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForumCreateCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate title correctly', () => {
    component.newTitle = '';
    expect(component.isValidTitle()).toBeFalsy();

    component.newTitle = '   ';
    expect(component.isValidTitle()).toBeFalsy();

    component.newTitle = 'Valid title';
    expect(component.isValidTitle()).toBeTruthy();
  });

  it('should emit createForum event', () => {
    spyOn(component.createForum, 'emit');
    component.onCreateForum();
    expect(component.createForum.emit).toHaveBeenCalled();
  });
});
