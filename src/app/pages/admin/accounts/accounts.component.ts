import { Component, inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/accounts/admin.service';
import { DatePipe } from '@angular/common';
import { Admin } from '../../../core/models/admin-config/admin.model';

@Component({
  selector: 'app-accounts',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css',
})
export class AccountsComponent {
  protected admins = signal<Admin[]>([]);
  protected loading = signal(true);
  protected showForm = signal(false);
  protected formLoading = signal(false);
  protected erro = signal('');
  protected sucesso = signal('');

  private adminService = inject(AdminService);

  protected novoAdminForm = new FormGroup({
    usuario: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    senha: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(30),
    ]),
    email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(100)]),
    nome: new FormControl(''),
  });

  ngOnInit(): void {
    this.carregarAdmins();
  }

  private carregarAdmins(): void {
    this.loading.set(true);
    this.adminService.listar().subscribe({
      next: (data) => {
        this.admins.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected criarAdmin(): void {
    if (this.novoAdminForm.invalid) {
      this.erro.set('Preencha todos os campos obrigatorios');
      return;
    }

    this.formLoading.set(true);
    this.erro.set('');

    const v = this.novoAdminForm.value;

    this.adminService
      .criar({
        usuario: v.usuario!,
        senha: v.senha!,
        email: v.email!,
        nome: v.nome || undefined,
      })
      .subscribe({
        next: () => {
          this.sucesso.set('Admin criado com sucesso');
          this.showForm.set(false);
          this.novoAdminForm.reset();
          this.formLoading.set(false);
          this.carregarAdmins();
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao criar admin');
          this.formLoading.set(false);
        },
      });
  }

  protected toggleAtivo(admin: Admin): void {
    const action = admin.ativo
      ? this.adminService.desativar(admin.id)
      : this.adminService.ativar(admin.id);

    action.subscribe({
      next: () => {
        this.sucesso.set(admin.ativo ? 'Admin desativado' : 'Admin ativado');
        this.carregarAdmins();
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao alterar status');
      },
    });
  }
}
