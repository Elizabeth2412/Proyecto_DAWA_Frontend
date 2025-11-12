import { TestBed } from '@angular/core/testing';

import { ServicioArchivos } from './servicio-archivos';

describe('ServicioArchivos', () => {
  let service: ServicioArchivos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioArchivos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
