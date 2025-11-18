import { TestBed } from '@angular/core/testing';
import { ServicioAutorizacion } from './autorizacion.service';
describe('ServicioAutorizacion', () => {
  let service: ServicioAutorizacion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServicioAutorizacion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
