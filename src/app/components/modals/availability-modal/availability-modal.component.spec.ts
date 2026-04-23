import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailabilityModalComponent } from './availability-modal.component';

describe('AvailabilityModalComponent', () => {
  let component: AvailabilityModalComponent;
  let fixture: ComponentFixture<AvailabilityModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailabilityModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvailabilityModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
