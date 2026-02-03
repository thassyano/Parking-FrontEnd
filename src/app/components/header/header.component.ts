import { Component, inject, input } from '@angular/core';
import { BtnClass } from '../../models/enums/button/button-class.enum';
import { Router } from '@angular/router';
import { HeaderButtonComponent } from '../header-button/header-button.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [HeaderButtonComponent, NgClass],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  public title = input.required<string>();
  public container = input.required<string>();
  public isAdmin = input.required<boolean>();
  protected btnClass = BtnClass;
  private router = inject(Router);

  public navigateHome(): void {
    this.router.navigateByUrl('home');
  }
}
