import { TestBed } from '@angular/core/testing';

import { Auth.InterceptorService } from './auth.interceptor.service';

describe('Auth.InterceptorService', () => {
  let service: Auth.InterceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Auth.InterceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
