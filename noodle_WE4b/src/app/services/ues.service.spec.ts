import { TestBed } from '@angular/core/testing';

import { UesService } from './ues.service';

describe('UesService', () => {
  let service: UesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
