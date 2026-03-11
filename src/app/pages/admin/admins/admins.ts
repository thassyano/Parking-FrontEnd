import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Admin } from '../../../core/models/admin.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-admins',
  imports: [FormsModule, DatePipe],
  templateUrl: './admins.html',
})
export class Admins implements OnInit {
  admins = signal<Admin[]>([]);
  loading = signal(true);
  showForm = signal(false);
  formLoading = signal(false);
  erro = signal('');
  sucesso = signal('');

  novoUsuario = '';
  novaSenha = '';
  novoEmail = '';
  novoNome = '';

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.carregarAdmins();
  }

  carregarAdmins() {
    this.loading.set(true);
    this.adminService.listar().subscribe({
      next: (data) => {
        this.admins.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  criarAdmin() {
    if (!this.novoUsuario || !this.novaSenha || !this.novoEmail) {
      this.erro.set('Preencha todos os campos obrigatorios');
      return;
    }
    this.formLoading.set(true);
    this.erro.set('');

    this.adminService
      .criar({
        usuario: this.novoUsuario,
        senha: this.novaSenha,
        email: this.novoEmail,
        nome: this.novoNome || undefined,
      })
      .subscribe({
        next: () => {
          this.sucesso.set('Admin criado com sucesso');
          this.showForm.set(false);
          this.novoUsuario = '';
          this.novaSenha = '';
          this.novoEmail = '';
          this.novoNome = '';
          this.formLoading.set(false);
          this.carregarAdmins();
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao criar admin');
          this.formLoading.set(false);
        },
      });
  }

  toggleAtivo(admin: Admin) {
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
