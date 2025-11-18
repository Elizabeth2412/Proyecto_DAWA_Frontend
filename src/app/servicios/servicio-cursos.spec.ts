import { TestBed } from '@angular/core/testing';

import { ServicioCursos } from './servicio-cursos';

describe('ServicioCursos', () => {
  let service: ServicioCursos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioCursos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
