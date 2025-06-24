import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { UeRegistrationComponent } from './ue-registration.component';
import { UesService } from '../../../services/ues.service';
import { UtilisateurService } from '../../../services/utilisateur.service';

describe('UeRegistrationComponent', () => {
  let component: UeRegistrationComponent;
  let fixture: ComponentFixture<UeRegistrationComponent>;
  let uesService: jasmine.SpyObj<UesService>;
  let utilisateurService: jasmine.SpyObj<UtilisateurService>;

  beforeEach(() => {
    const uesServiceSpy = jasmine.createSpyObj('UesService', ['getAllUes']);
    const utilisateurServiceSpy = jasmine.createSpyObj('UtilisateurService', ['getUtilisateurs']);

    TestBed.configureTestingModule({
      declarations: [UeRegistrationComponent],
      providers: [
        { provide: UesService, useValue: uesServiceSpy },
        { provide: UtilisateurService, useValue: utilisateurServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(UeRegistrationComponent);
    component = fixture.componentInstance;
    uesService = TestBed.inject(UesService) as jasmine.SpyObj<UesService>;
    utilisateurService = TestBed.inject(UtilisateurService) as jasmine.SpyObj<UtilisateurService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial data on init', async () => {
    uesService.getAllUes.and.returnValue(of([]));
    utilisateurService.getUtilisateurs.and.returnValue(of([]));

    await component.loadInitialData();

    expect(uesService.getAllUes).toHaveBeenCalled();
    expect(utilisateurService.getUtilisateurs).toHaveBeenCalled();
  });

  it('should handle UE created event', () => {
    const mockUe = { id: '1', code: 'TEST', intitule: 'Test UE', ects: 6 } as any;

    component.onUeCreated(mockUe);

    expect(component.ues).toContain(mockUe);
    expect(component.success).toBeTruthy();
  });

  it('should enter edit mode', () => {
    const mockUe = { id: '1', code: 'TEST', intitule: 'Test UE', ects: 6 } as any;

    component.onEditUe(mockUe);

    expect(component.isEditMode).toBeTruthy();
    expect(component.editingUe).toEqual(mockUe);
  });
});
