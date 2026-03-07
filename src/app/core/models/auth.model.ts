export interface LoginRequest {
  usuario: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: string;
  nome: string;
  expiraEm: string;
}
