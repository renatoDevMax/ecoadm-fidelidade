import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://renatodevfidelidade:maxjr1972@clusterrenato.asbtntk.mongodb.net/ecoFidelidade?retryWrites=true&w=majority&appName=clusterRenato";

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado ao MongoDB com sucesso!");
  } catch (error) {
    console.error("Erro na conexão com MongoDB:", error);
    process.exit(1);
  }
}
