import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Produto from "../../../../models/Produto";

export async function PUT(request: Request) {
  try {
    // Conectar ao banco de dados
    await connectDB();

    // Obter dados da requisição
    const { id, destaque } = await request.json();

    // Validar entrada
    if (!id) {
      return NextResponse.json(
        { error: "ID do produto é obrigatório" },
        { status: 400 }
      );
    }

    if (typeof destaque !== "boolean") {
      return NextResponse.json(
        { error: "Campo 'destaque' deve ser um booleano" },
        { status: 400 }
      );
    }

    // Atualizar no banco de dados
    const produtoAtualizado = await Produto.findByIdAndUpdate(
      id,
      { destaque },
      { new: true, runValidators: true }
    );

    if (!produtoAtualizado) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Produto ${
        destaque ? "destacado" : "removido dos destaques"
      } com sucesso`,
      produto: produtoAtualizado,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar destaque do produto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar destaque do produto" },
      { status: 500 }
    );
  }
}
