import { Component, signal } from '@angular/core';
import { ButtonComponent } from "../../components/button/button.component";
import { BtnClass } from '../../models/enums/button/button-class.enum';

@Component({
  selector: 'app-home',
  imports: [ButtonComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
    public btnClassEnum = BtnClass;

}
