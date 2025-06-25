import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UeCardComponent } from './ue-card.component';

describe('UeCardComponent', () => {
  let component: UeCardComponent;
  let fixture: ComponentFixture<UeCardComponent>;

  const mockUe = {
    id: '1',
    code: 'WE4A',
    intitule: 'Développement Web',
    description: 'Description test',
    ects: 6,
    participants: ['1', '2'],
    image: 'test.jpg',
    createdAt: '2024-01-01'
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UeCardComponent]
    });

    fixture = TestBed.createComponent(UeCardComponent);
    component = fixture.componentInstance;
    component.ue = mockUe;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit edit event', () => {
    spyOn(component.edit, 'emit');

    component.onEdit();

    expect(component.edit.emit).toHaveBeenCalledWith(mockUe);
  });

  it('should emit delete event', () => {
    spyOn(component.delete, 'emit');

    component.onDelete();

    expect(component.delete.emit).toHaveBeenCalledWith(mockUe);
  });

  it('should get correct participant count', () => {
    expect(component.getParticipantCount()).toBe(2);
  });

  it('should format image URL correctly', () => {
    expect(component.getImageUrl('test.jpg')).toBe('http://localhost:3000/uploads/ue/test.jpg');
    expect(component.getImageUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg');
  });

  it('should truncate long descriptions', () => {
    const longDescription = 'A'.repeat(150);
    const truncated = component.truncateDescription(longDescription, 100);

    expect(truncated.length).toBeLessThanOrEqual(103); // 100 + '...'
    expect(truncated).toContain('...');
  });
});
