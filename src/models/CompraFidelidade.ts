import mongoose, { Schema } from "mongoose";

const compraFidelidadeSchema = new Schema({
  data: { type: Date, required: true, default: Date.now },
  nome: { type: String, required: true },
  valor: { type: Number, required: true },
  credito: { type: Number, required: true },
  statusCred: { type: String, required: true, default: "aberto" },
});

// Verifica se o modelo já existe antes de criar um novo
export const CompraFidelidade =
  mongoose.models.CompraFidelidade ||
  mongoose.model(
    "CompraFidelidade",
    compraFidelidadeSchema,
    "comprasFidelidade"
  );
