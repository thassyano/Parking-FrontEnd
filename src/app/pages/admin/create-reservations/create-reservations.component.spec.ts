import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateReservationsComponent } from './create-reservations.component';

describe('CreateReservationsComponent', () => {
  let component: CreateReservationsComponent;
  let fixture: ComponentFixture<CreateReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateReservationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
