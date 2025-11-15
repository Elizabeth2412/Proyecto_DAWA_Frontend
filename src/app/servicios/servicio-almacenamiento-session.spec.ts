import { TestBed } from '@angular/core/testing';

import { ServicioAlmacenamientoSession } from './servicio-almacenamiento-session';

describe('ServicioAlmacenamientoSession', () => {
  let service: ServicioAlmacenamientoSession;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioAlmacenamientoSession);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
