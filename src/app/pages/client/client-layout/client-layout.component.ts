import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { HeaderComponent } from "../../../components/header/header.component";

@Component({
  selector: 'app-client-layout',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './client-layout.component.html',
  styleUrl: './client-layout.component.css',
})
export class ClientLayoutComponent {

}
