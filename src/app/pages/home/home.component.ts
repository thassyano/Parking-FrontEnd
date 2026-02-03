import { Component, inject } from '@angular/core';
import { ButtonComponent } from "../../components/button/button.component";
import { BtnClass } from '../../models/enums/button/button-class.enum';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [ButtonComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
    public btnClassEnum = BtnClass;
    private router = inject(Router);
    
    protected navigate(route: string): void {
        this.router.navigateByUrl(route);
    }

}
