import mongoose, { Schema } from "mongoose";

const clienteFiliadoSchema = new Schema({
  nome: { type: String, required: true },
  cpfcnpj: { type: String, required: true },
  endereco: { type: String, required: true },
  contato: { type: String, required: true },
  beneficios: { type: [String], required: true },
  tipoCliente: { type: String, required: true, default: "filiado" },
  matriz: { type: String, required: true }, // Nome da matriz associada
  beneficioMatriz: { type: [String], required: true }, // Benefícios da matriz
  dataCadastro: { type: Date, default: Date.now },
  email: { type: String, required: true },
  senha: { type: String, required: true },
});

// Verifica se o modelo já existe antes de criar um novo
export const ClienteFiliado =
  mongoose.models.ClienteFiliado ||
  mongoose.model("ClienteFiliado", clienteFiliadoSchema, "clienteFiliado");
