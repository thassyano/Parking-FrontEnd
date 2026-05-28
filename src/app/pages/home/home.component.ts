import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LandingButtonComponent } from "../../components/buttons/landing-button/landing-button.component";

@Component({
  selector: 'app-home',
  imports: [LandingButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent{
  private router = inject(Router);

  protected goToClient(): void {
    this.router.navigateByUrl('/cliente');
  }

  protected goToAdmin(): void {
    this.router.navigateByUrl('/admin/login');
  }
}
