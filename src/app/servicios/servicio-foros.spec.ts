import { TestBed } from '@angular/core/testing';

import { ServicioForos } from './servicio-foros';

describe('ServicioForos', () => {
  let service: ServicioForos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioForos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
