import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://renatodevfidelidade:maxjr1972@clusterrenato.asbtntk.mongodb.net/ecoFidelidade?retryWrites=true&w=majority&appName=clusterRenato";

if (!MONGODB_URI) {
  throw new Error("Por favor, defina a variável de ambiente MONGODB_URI");
}

// Objeto para armazenar a conexão
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Variável para manter a conexão através das invocações serverless
let cached: MongooseConnection = (global as any).mongoose;

// Inicializa a conexão em cache se ainda não existir
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // Se já temos uma conexão, retorne-a
  if (cached.conn) {
    return cached.conn;
  }

  // Se uma promessa de conexão já está em andamento, aguarde por ela
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxIdleTimeMS: 30000, // 30 segundos
      serverSelectionTimeoutMS: 10000, // 10 segundos
      socketTimeoutMS: 30000, // 30 segundos
    };

    // Inicia uma nova promessa de conexão
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("Conectado ao MongoDB com sucesso!");
        return mongoose;
      })
      .catch((error) => {
        console.error("Erro na conexão com MongoDB:", error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    // Resolve a promessa da conexão
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    // Limpar a promessa em caso de erro para permitir nova tentativa
    cached.promise = null;
    throw e;
  }
}
