import { NextResponse } from "next/server";
import Produto from "@/models/Produto";
import { connectDB } from "@/lib/db";

export async function POST(request: Request) {
  console.log("API chamada: /api/produtos/atualizar-preco");

  try {
    // Conectar ao banco de dados
    await connectDB();
    console.log("Conexão com o banco estabelecida");

    // Extrair dados do corpo da requisição
    const body = await request.json();
    const { codigo, preco } = body;

    console.log(`Dados recebidos: Código=${codigo}, Preço=${preco}`);

    // Validar os dados
    if (!codigo) {
      console.log("Erro: Código do produto é obrigatório");
      return NextResponse.json(
        { error: "Código do produto é obrigatório" },
        { status: 400 }
      );
    }

    if (isNaN(preco) || preco <= 0) {
      console.log(`Erro: Preço inválido: ${preco}`);
      return NextResponse.json({ error: "Preço inválido" }, { status: 400 });
    }

    // Buscar o produto pelo código como string
    console.log(`Buscando produto com código: ${codigo}`);
    let produto = await Produto.findOne({ cod: codigo });

    // Se não encontrou, tente algumas variações do código
    if (!produto) {
      console.log(
        `Produto não encontrado com código exato: ${codigo}, tentando alternativas...`
      );

      // Variação 1: buscar um produto que contenha esse código como parte do campo cod
      console.log(`Tentando busca com regex: ${codigo}`);
      produto = await Produto.findOne({
        $or: [
          { cod: { $regex: codigo, $options: "i" } },
          { nome: { $regex: codigo, $options: "i" } },
        ],
      });
    }

    // Verificar se o produto existe
    if (!produto) {
      console.log(`Produto com código ${codigo} não encontrado`);
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    console.log(
      `Produto encontrado: ${produto.nome}, preço atual: ${produto.preco}`
    );

    // Atualizar o preço
    produto.preco = preco;
    await produto.save();
    console.log(`Preço atualizado para: ${preco}`);

    // Retornar resposta de sucesso
    const resposta = {
      success: true,
      message: "Preço atualizado com sucesso",
      produto: {
        id: produto._id.toString(),
        nome: produto.nome,
        preco: produto.preco,
        codigo: produto.cod,
      },
    };

    console.log("Resposta de sucesso:", resposta);
    return NextResponse.json(resposta);
  } catch (error: any) {
    console.error("Erro ao atualizar preço:", error);

    return NextResponse.json(
      { error: "Erro ao atualizar preço do produto", details: error.message },
      { status: 500 }
    );
  }
}
