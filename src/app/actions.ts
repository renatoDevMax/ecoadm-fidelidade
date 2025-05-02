"use server";

import { ClienteMatriz } from "../models/ClienteMatriz";
import { ClienteFiliado } from "../models/ClienteFiliado";
import { CompraFidelidade } from "../models/CompraFidelidade";
import Produto from "../models/Produto";

export async function cadastrarClienteMatriz(dados: {
  nome: string;
  cpfcnpj: string;
  endereco: string;
  contato: string;
  beneficios: string[];
  email: string;
  senha: string;
}) {
  try {
    // Adiciona o tipo de cliente "matriz" aos dados
    const dadosCompletos = {
      ...dados,
      tipoCliente: "matriz",
    };

    const novoCliente = await ClienteMatriz.create(dadosCompletos);

    // Converta para um objeto simples antes de retornar
    return {
      success: true,
      data: {
        id: novoCliente._id.toString(),
        nome: novoCliente.nome,
        cpfcnpj: novoCliente.cpfcnpj,
        endereco: novoCliente.endereco,
        contato: novoCliente.contato,
        beneficios: novoCliente.beneficios,
        tipoCliente: novoCliente.tipoCliente,
        dataCadastro: novoCliente.dataCadastro,
        email: novoCliente.email,
        senha: novoCliente.senha,
      },
    };
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);
    return { success: false, error: "Erro ao cadastrar cliente" };
  }
}

export async function buscarClientesMatriz() {
  try {
    // Busca todos os clientes com tipoCliente = "matriz"
    const clientes = await ClienteMatriz.find({ tipoCliente: "matriz" });

    // Retorna id, nome e benefícios
    return {
      success: true,
      data: clientes.map((cliente) => ({
        id: cliente._id.toString(),
        nome: cliente.nome,
        beneficios: cliente.beneficios,
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar clientes matriz:", error);
    return { success: false, error: "Erro ao buscar clientes matriz" };
  }
}

export async function cadastrarClienteFiliado(dados: {
  nome: string;
  cpfcnpj: string;
  endereco: string;
  contato: string;
  beneficios: string[];
  matriz: string;
  beneficioMatriz: string[];
  email: string;
  senha: string;
}) {
  try {
    // Adiciona o tipo de cliente "filiado" aos dados
    const dadosCompletos = {
      ...dados,
      tipoCliente: "filiado",
    };

    const novoCliente = await ClienteFiliado.create(dadosCompletos);

    // Converta para um objeto simples antes de retornar
    return {
      success: true,
      data: {
        id: novoCliente._id.toString(),
        nome: novoCliente.nome,
        cpfcnpj: novoCliente.cpfcnpj,
        endereco: novoCliente.endereco,
        contato: novoCliente.contato,
        beneficios: novoCliente.beneficios,
        matriz: novoCliente.matriz,
        beneficioMatriz: novoCliente.beneficioMatriz,
        tipoCliente: novoCliente.tipoCliente,
        dataCadastro: novoCliente.dataCadastro,
        email: novoCliente.email,
        senha: novoCliente.senha,
      },
    };
  } catch (error) {
    console.error("Erro ao cadastrar cliente filiado:", error);
    return { success: false, error: "Erro ao cadastrar cliente filiado" };
  }
}

export async function buscarTodosClientes() {
  try {
    // Busca clientes de ambas as coleções
    const clientesMatriz = await ClienteMatriz.find({}).lean();
    const clientesFiliado = await ClienteFiliado.find({}).lean();

    // Combina os resultados
    const todosClientes = [
      ...clientesMatriz.map((cliente: any) => ({
        id: cliente._id.toString(),
        nome: cliente.nome,
        cpfcnpj: cliente.cpfcnpj,
        endereco: cliente.endereco,
        contato: cliente.contato,
        beneficios: cliente.beneficios,
        tipoCliente: cliente.tipoCliente,
        matriz: undefined, // Clientes matriz não têm matriz associada
        dataCadastro: cliente.dataCadastro,
        email: cliente.email,
        senha: cliente.senha,
      })),
      ...clientesFiliado.map((cliente: any) => ({
        id: cliente._id.toString(),
        nome: cliente.nome,
        cpfcnpj: cliente.cpfcnpj,
        endereco: cliente.endereco,
        contato: cliente.contato,
        beneficios: cliente.beneficios,
        tipoCliente: cliente.tipoCliente,
        matriz: cliente.matriz,
        beneficioMatriz: cliente.beneficioMatriz,
        dataCadastro: cliente.dataCadastro,
        email: cliente.email,
        senha: cliente.senha,
      })),
    ];

    // Ordenar por nome em ordem alfabética
    todosClientes.sort((a, b) => a.nome.localeCompare(b.nome));

    return {
      success: true,
      data: todosClientes,
    };
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return { success: false, error: "Erro ao buscar clientes" };
  }
}

export async function adicionarCompra(dados: {
  nome: string;
  valor: number;
  credito: number;
}) {
  try {
    const compra = {
      data: new Date(),
      nome: dados.nome,
      valor: dados.valor,
      credito: dados.credito,
      statusCred: "aberto",
    };

    const novaCompra = await CompraFidelidade.create(compra);

    return {
      success: true,
      data: {
        id: novaCompra._id.toString(),
        data: novaCompra.data,
        nome: novaCompra.nome,
        valor: novaCompra.valor,
        credito: novaCompra.credito,
        statusCred: novaCompra.statusCred,
      },
    };
  } catch (error) {
    console.error("Erro ao adicionar compra:", error);
    return { success: false, error: "Erro ao adicionar compra" };
  }
}

export async function buscarCreditosAbertos(nomeCliente: string) {
  try {
    // Busca todas as compras do cliente com status "aberto"
    const comprasAbertas = await CompraFidelidade.find({
      nome: nomeCliente,
      statusCred: "aberto",
    }).lean();

    // Data de 30 dias atrás para comparação
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    // Filtra as compras realizadas nos últimos 30 dias
    const comprasValidas = comprasAbertas.filter((compra: any) => {
      const dataCompra = new Date(compra.data);
      return dataCompra >= dataLimite;
    });

    // Calcula o total de créditos acumulados apenas para compras dos últimos 30 dias
    const totalCreditos = comprasValidas.reduce(
      (total, compra: any) => total + compra.credito,
      0
    );

    return {
      success: true,
      data: {
        compras: comprasValidas.map((compra: any) => ({
          id: compra._id.toString(),
          data: compra.data,
          valor: compra.valor,
          credito: compra.credito,
        })),
        totalCreditos,
        comprasExpiradas: comprasAbertas.length - comprasValidas.length,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar créditos abertos:", error);
    return {
      success: false,
      error: "Erro ao buscar créditos abertos",
    };
  }
}

export async function resgatarCreditos(nomeCliente: string) {
  try {
    // Atualiza todas as compras do cliente com statusCred "aberto" para "resgatado"
    const resultado = await CompraFidelidade.updateMany(
      { nome: nomeCliente, statusCred: "aberto" },
      { statusCred: "resgatado" }
    );

    return {
      success: true,
      data: {
        quantidadeAtualizada: resultado.modifiedCount,
      },
    };
  } catch (error) {
    console.error("Erro ao resgatar créditos:", error);
    return { success: false, error: "Erro ao resgatar créditos" };
  }
}

export async function buscarTodasCompras(nomeCliente: string) {
  try {
    // Busca todas as compras do cliente, independente do status
    const compras = await CompraFidelidade.find({
      nome: nomeCliente,
    })
      .sort({ data: -1 })
      .lean(); // Ordenar por data, mais recente primeiro

    // Calcula o total de créditos (abertos e resgatados)
    const creditosAbertos = compras
      .filter((compra: any) => compra.statusCred === "aberto")
      .reduce((total: number, compra: any) => total + compra.credito, 0);

    const creditosResgatados = compras
      .filter((compra: any) => compra.statusCred === "resgatado")
      .reduce((total: number, compra: any) => total + compra.credito, 0);

    return {
      success: true,
      data: {
        compras: compras.map((compra: any) => ({
          id: compra._id.toString(),
          data: compra.data,
          valor: compra.valor,
          credito: compra.credito,
          statusCred: compra.statusCred,
        })),
        totalCreditosAbertos: creditosAbertos,
        totalCreditosResgatados: creditosResgatados,
        totalCompras: compras.length,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar compras:", error);
    return {
      success: false,
      error: "Erro ao buscar compras",
    };
  }
}

export async function atualizarCompra(dados: {
  id: string;
  valor: number;
  credito: number;
  statusCred: string;
}) {
  try {
    const compra = await CompraFidelidade.findById(dados.id);

    if (!compra) {
      return { success: false, error: "Compra não encontrada" };
    }

    // Atualiza os campos
    compra.valor = dados.valor;
    compra.credito = dados.credito;
    compra.statusCred = dados.statusCred;

    // Salva as alterações
    await compra.save();

    return {
      success: true,
      data: {
        id: compra._id.toString(),
        data: compra.data,
        nome: compra.nome,
        valor: compra.valor,
        credito: compra.credito,
        statusCred: compra.statusCred,
      },
    };
  } catch (error) {
    console.error("Erro ao atualizar compra:", error);
    return { success: false, error: "Erro ao atualizar compra" };
  }
}

export async function deletarCompra(id: string) {
  try {
    const resultado = await CompraFidelidade.findByIdAndDelete(id);

    if (!resultado) {
      return { success: false, error: "Compra não encontrada" };
    }

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Erro ao excluir compra:", error);
    return { success: false, error: "Erro ao excluir compra" };
  }
}

export async function buscarClientePorId(id: string) {
  try {
    // Tenta encontrar na coleção de matriz primeiro
    let cliente = (await ClienteMatriz.findById(id).lean()) as any;

    // Se não encontrar na matriz, procura na coleção de filiados
    if (!cliente) {
      cliente = (await ClienteFiliado.findById(id).lean()) as any;
    }

    if (!cliente) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    return {
      success: true,
      data: {
        id: cliente._id.toString(),
        nome: cliente.nome,
        cpfcnpj: cliente.cpfcnpj,
        endereco: cliente.endereco,
        contato: cliente.contato,
        beneficios: cliente.beneficios,
        tipoCliente: cliente.tipoCliente,
        dataCadastro: cliente.dataCadastro,
        email: cliente.email,
        senha: cliente.senha,
        matriz: cliente.matriz,
        beneficioMatriz: cliente.beneficioMatriz,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return {
      success: false,
      error: "Erro ao buscar cliente",
    };
  }
}

export async function atualizarCliente(dados: {
  id: string;
  nome: string;
  cpfcnpj: string;
  endereco: string;
  contato: string;
  email: string;
  senha: string;
  beneficios: string[];
  tipoCliente: string;
  matriz?: string;
  beneficioMatriz?: string[];
}) {
  try {
    const { id, tipoCliente } = dados;

    // Determina qual modelo usar com base no tipo de cliente
    const Modelo = tipoCliente === "matriz" ? ClienteMatriz : ClienteFiliado;

    // Encontra e atualiza o cliente
    const clienteAtualizado = await Modelo.findByIdAndUpdate(
      id,
      { ...dados },
      { new: true } // Retorna o documento atualizado
    );

    if (!clienteAtualizado) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    return {
      success: true,
      data: {
        id: clienteAtualizado._id.toString(),
        nome: clienteAtualizado.nome,
        cpfcnpj: clienteAtualizado.cpfcnpj,
        endereco: clienteAtualizado.endereco,
        contato: clienteAtualizado.contato,
        email: clienteAtualizado.email,
        senha: clienteAtualizado.senha,
        beneficios: clienteAtualizado.beneficios,
        tipoCliente: clienteAtualizado.tipoCliente,
        matriz: clienteAtualizado.matriz,
        beneficioMatriz: clienteAtualizado.beneficioMatriz,
        dataCadastro: clienteAtualizado.dataCadastro,
      },
    };
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return {
      success: false,
      error: "Erro ao atualizar cliente",
    };
  }
}

export async function excluirCliente(id: string, tipoCliente: string) {
  try {
    // Determina qual modelo usar com base no tipo de cliente
    const Modelo = tipoCliente === "matriz" ? ClienteMatriz : ClienteFiliado;

    // Remove o cliente
    const resultado = await Modelo.findByIdAndDelete(id);

    if (!resultado) {
      return {
        success: false,
        error: "Cliente não encontrado",
      };
    }

    return {
      success: true,
      message: "Cliente excluído com sucesso",
    };
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return { success: false, error: "Erro ao excluir cliente" };
  }
}

export async function buscarProdutos(
  busca: string = "",
  categoria: string = "",
  apenasAtivados: boolean = true
) {
  try {
    // Criar filtro base
    let filtro: any = {};

    // Adicionar filtro de busca se fornecido
    if (busca) {
      // Verificar se busca pode ser convertida para um número (para buscar por código)
      const buscaComoNumero = !isNaN(Number(busca)) ? Number(busca) : null;

      filtro.$or = [
        { nome: { $regex: busca, $options: "i" } },
        { descricao: { $regex: busca, $options: "i" } },
      ];

      // Adicionar busca por código se busca for um número
      if (buscaComoNumero !== null) {
        filtro.$or.push({ cod: buscaComoNumero });
      }
    }

    // Adicionar filtro de categoria se fornecido e não for "Todas"
    if (categoria && categoria !== "Todas") {
      filtro.categoria = categoria;
    }

    // Filtrar apenas produtos ativados se solicitado
    if (apenasAtivados) {
      filtro.ativado = true;
    }

    // Buscar produtos com o filtro composto
    const produtos = await Produto.find(filtro).sort({ nome: 1 }).lean();

    return {
      success: true,
      data: produtos.map((produto: any) => ({
        id: produto._id.toString(),
        nome: produto.nome,
        preco: produto.preco,
        descricao: produto.descricao,
        categoria: produto.categoria,
        imagem: produto.imagem,
        destaque: produto.destaque,
        cod: produto.cod,
        ativado: produto.ativado,
        createdAt: produto.createdAt,
        updatedAt: produto.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return { success: false, error: "Erro ao buscar produtos" };
  }
}

export async function buscarCategoriasProdutos() {
  try {
    // Buscar categorias distintas
    const categorias = await Produto.distinct("categoria");

    // Adicionar "Todas" como primeira opção
    return {
      success: true,
      data: ["Todas", ...categorias],
    };
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return { success: false, error: "Erro ao buscar categorias" };
  }
}
