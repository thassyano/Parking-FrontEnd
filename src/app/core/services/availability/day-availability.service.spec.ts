import { TestBed } from '@angular/core/testing';

import { DayAvailabilityService } from './day-availability.service';

describe('DayAvailabilityService', () => {
  let service: DayAvailabilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DayAvailabilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
