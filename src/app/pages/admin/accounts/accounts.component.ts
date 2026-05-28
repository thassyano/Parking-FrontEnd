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
  protected editingAdmin = signal<Admin | null>(null);
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

  protected editarAdminForm = new FormGroup({
    usuario: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    senha: new FormControl('', [Validators.minLength(6), Validators.maxLength(30)]),
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

  protected abrirFormCriar(): void {
    this.cancelarEdicao();
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.novoAdminForm.reset();
    }
  }

  protected abrirEdicao(admin: Admin): void {
    this.showForm.set(false);
    this.novoAdminForm.reset();
    this.erro.set('');
    this.sucesso.set('');
    this.editingAdmin.set(admin);
    this.editarAdminForm.reset({
      usuario: admin.usuario,
      email: admin.email,
      nome: admin.nome || '',
      senha: '',
    });
  }

  protected cancelarEdicao(): void {
    this.editingAdmin.set(null);
    this.editarAdminForm.reset();
  }

  protected criarAdmin(): void {
    this.novoAdminForm.markAllAsTouched();

    const mensagemErro = this.getErroFormulario(this.novoAdminForm, true);
    if (mensagemErro) {
      this.erro.set(mensagemErro);
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
          this.erro.set(this.extrairErroApi(err, 'Erro ao criar admin'));
          this.formLoading.set(false);
        },
      });
  }

  protected salvarEdicao(): void {
    const admin = this.editingAdmin();
    this.editarAdminForm.markAllAsTouched();

    const mensagemErro = admin ? this.getErroFormulario(this.editarAdminForm, false) : 'Admin não encontrado';
    if (!admin || mensagemErro) {
      this.erro.set(mensagemErro || 'Verifique os campos do formulário');
      return;
    }

    this.formLoading.set(true);
    this.erro.set('');

    const v = this.editarAdminForm.value;

    this.adminService
      .atualizar(admin.id, {
        usuario: v.usuario!,
        email: v.email!,
        nome: v.nome || undefined,
        senha: v.senha?.trim() ? v.senha : undefined,
      })
      .subscribe({
        next: () => {
          this.sucesso.set('Admin atualizado com sucesso');
          this.cancelarEdicao();
          this.formLoading.set(false);
          this.carregarAdmins();
        },
        error: (err) => {
          this.erro.set(this.extrairErroApi(err, 'Erro ao atualizar admin'));
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
        this.erro.set(this.extrairErroApi(err, 'Erro ao alterar status'));
      },
    });
  }

  protected campoInvalido(form: FormGroup, nome: string): boolean {
    const control = form.get(nome);
    return !!(control && control.invalid && control.touched);
  }

  private getErroFormulario(form: FormGroup, senhaObrigatoria: boolean): string | null {
    const usuario = form.get('usuario');
    const senha = form.get('senha');
    const email = form.get('email');

    if (usuario?.hasError('required')) return 'Informe o usuário';
    if (usuario?.hasError('maxlength')) return 'Usuário deve ter no máximo 50 caracteres';
    if (senhaObrigatoria && senha?.hasError('required')) return 'Informe a senha';
    if (senha?.hasError('minlength')) return 'A senha deve ter pelo menos 6 caracteres';
    if (senha?.hasError('maxlength')) return 'A senha deve ter no máximo 30 caracteres';
    if (email?.hasError('required')) return 'Informe o email';
    if (email?.hasError('email')) return 'Informe um email válido';
    if (email?.hasError('maxlength')) return 'Email deve ter no máximo 100 caracteres';
    if (form.invalid) return 'Verifique os campos do formulário';
    return null;
  }

  private extrairErroApi(err: { status?: number; error?: unknown }, fallback: string): string {
    const body = err.error as Record<string, unknown> | string | null;

    if (err.status === 405) {
      return 'A API ainda não tem o endpoint de edição. Faça deploy/restart do backend.';
    }

    if (err.status === 403) {
      return 'Sem permissão. Faça logout e login novamente com perfil Admin Master.';
    }

    if (typeof body === 'string' && body.trim()) return body;

    if (body && typeof body === 'object') {
      if (typeof body['message'] === 'string') return body['message'];

      const errors = body['errors'] as Record<string, string[]> | undefined;
      if (errors) {
        const first = Object.values(errors)[0]?.[0];
        if (first) return first;
      }

      if (typeof body['title'] === 'string') return body['title'];
    }

    return err.status ? `${fallback} (HTTP ${err.status})` : fallback;
  }
}
