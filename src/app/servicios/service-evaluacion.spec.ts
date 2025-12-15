import { TestBed } from '@angular/core/testing';
import { ServiceEvaluacion } from './service-evaluacion';

describe('ServiceEvaluacion', () => {
  let service: ServiceEvaluacion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceEvaluacion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
