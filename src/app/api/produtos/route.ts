import { NextRequest, NextResponse } from "next/server";
import Produto from "../../../models/Produto";
import { connectDB } from "../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const produto = await request.json();

    // Validar campos obrigatórios
    if (
      !produto.nome ||
      !produto.imagem ||
      !produto.cod ||
      produto.preco <= 0
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes ou inválidos" },
        { status: 400 }
      );
    }

    // Verificar se já existe um produto com o mesmo código
    const produtoExistente = await Produto.findOne({ cod: produto.cod });
    if (produtoExistente) {
      return NextResponse.json(
        { error: "Já existe um produto com este código" },
        { status: 409 }
      );
    }

    // Criar o novo produto
    const novoProduto = await Produto.create(produto);

    return NextResponse.json(
      {
        success: true,
        message: "Produto adicionado com sucesso",
        produto: {
          id: novoProduto._id.toString(),
          nome: novoProduto.nome,
          preco: novoProduto.preco,
          descricao: novoProduto.descricao,
          categoria: novoProduto.categoria,
          imagem: novoProduto.imagem,
          destaque: novoProduto.destaque,
          cod: novoProduto.cod,
          ativado: novoProduto.ativado,
          createdAt: novoProduto.createdAt,
          updatedAt: novoProduto.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao adicionar produto:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao adicionar produto",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const produto = await request.json();

    // Validar campos obrigatórios
    if (
      !produto.id ||
      !produto.nome ||
      !produto.imagem ||
      !produto.cod ||
      produto.preco <= 0
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes ou inválidos" },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const produtoExistente = await Produto.findById(produto.id);
    if (!produtoExistente) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o código já está em uso por outro produto
    if (produto.cod !== produtoExistente.cod) {
      const produtoComMesmoCod = await Produto.findOne({
        cod: produto.cod,
        _id: { $ne: produto.id },
      });

      if (produtoComMesmoCod) {
        return NextResponse.json(
          { error: "Já existe outro produto com este código" },
          { status: 409 }
        );
      }
    }

    // Atualizar o produto
    const produtoAtualizado = await Produto.findByIdAndUpdate(
      produto.id,
      {
        nome: produto.nome,
        preco: produto.preco,
        descricao: produto.descricao,
        categoria: produto.categoria,
        imagem: produto.imagem,
        destaque: produto.destaque,
        cod: produto.cod,
        ativado: produto.ativado,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Produto atualizado com sucesso",
      produto: {
        id: produtoAtualizado._id.toString(),
        nome: produtoAtualizado.nome,
        preco: produtoAtualizado.preco,
        descricao: produtoAtualizado.descricao,
        categoria: produtoAtualizado.categoria,
        imagem: produtoAtualizado.imagem,
        destaque: produtoAtualizado.destaque,
        cod: produtoAtualizado.cod,
        ativado: produtoAtualizado.ativado,
        createdAt: produtoAtualizado.createdAt,
        updatedAt: produtoAtualizado.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao atualizar produto",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { id } = await request.json();

    // Validar se o ID foi fornecido
    if (!id) {
      return NextResponse.json(
        { error: "ID do produto não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se o produto existe antes de excluir
    const produtoExistente = await Produto.findById(id);
    if (!produtoExistente) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Excluir o produto usando o ID
    await Produto.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Produto excluído com sucesso",
      id,
    });
  } catch (error: any) {
    console.error("Erro ao excluir produto:", error);

    // Verificar se é um erro de ID inválido (formato incorreto)
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return NextResponse.json(
        {
          success: false,
          error: "ID do produto inválido",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao excluir produto",
      },
      { status: 500 }
    );
  }
}
