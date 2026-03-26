import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { HeaderComponent } from "../../../components/header/header.component";

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {

}
