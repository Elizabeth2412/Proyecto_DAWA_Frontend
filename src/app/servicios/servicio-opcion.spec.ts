import { TestBed } from '@angular/core/testing';

import { ServicioOpcion } from './servicio-opcion';

describe('ServicioOpcion', () => {
  let service: ServicioOpcion   ;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioOpcion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
