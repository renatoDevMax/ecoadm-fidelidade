import mongoose, { Schema, Document } from "mongoose";

export interface IProduto extends Document {
  nome: string;
  preco: number;
  descricao: string;
  categoria: string;
  imagem: string;
  destaque: boolean;
  cod: string;
  ativado: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProdutoSchema = new Schema<IProduto>(
  {
    nome: { type: String, required: true },
    preco: { type: Number, required: true },
    descricao: { type: String, default: "" },
    categoria: { type: String, default: "" },
    imagem: { type: String, required: true },
    destaque: { type: Boolean, default: false },
    cod: { type: String, required: true, unique: true },
    ativado: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Produto ||
  mongoose.model<IProduto>("Produto", ProdutoSchema);
