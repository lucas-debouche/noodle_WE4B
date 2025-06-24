import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { UeListComponent } from './ue-list.component';
import { UesService } from '../../../../../services/ues.service';

describe('UeListComponent', () => {
  let component: UeListComponent;
  let fixture: ComponentFixture<UeListComponent>;
  let uesService: jasmine.SpyObj<UesService>;

  const mockUes = [
    { id: '1', code: 'WE4A', intitule: 'Développement Web', ects: 6 },
    { id: '2', code: 'MT101', intitule: 'Mathématiques', ects: 4 }
  ] as any[];

  beforeEach(() => {
    const uesServiceSpy = jasmine.createSpyObj('UesService', ['deleteUe']);

    TestBed.configureTestingModule({
      declarations: [UeListComponent],
      imports: [FormsModule],
      providers: [
        { provide: UesService, useValue: uesServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(UeListComponent);
    component = fixture.componentInstance;
    component.ues = mockUes;
    uesService = TestBed.inject(UesService) as jasmine.SpyObj<UesService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter UEs on search', () => {
    component.searchTerm = 'web';
    component.onSearchChange();

    expect(component.filteredUes.length).toBe(1);
    expect(component.filteredUes[0].intitule).toContain('Web');
  });

  it('should emit edit event', () => {
    spyOn(component.editUe, 'emit');
    const ue = mockUes[0];

    component.onEditUe(ue);

    expect(component.editUe.emit).toHaveBeenCalledWith(ue);
  });

  it('should delete UE after confirmation', async () => {
    uesService.deleteUe.and.returnValue(of({ success: true }));
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component.deleteUe, 'emit');

    await component.onDeleteUe(mockUes[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(uesService.deleteUe).toHaveBeenCalledWith(mockUes[0].id);
    expect(component.deleteUe.emit).toHaveBeenCalledWith(mockUes[0]);
  });
});
