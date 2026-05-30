import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackBtnComponent } from '../../../components/buttons/back-btn/back-btn.component';

@Component({
  selector: 'app-client-layout',
  imports: [RouterOutlet, BackBtnComponent],
  templateUrl: './client-layout.component.html',
  styleUrl: './client-layout.component.css',
})
export class ClientLayoutComponent {

}
