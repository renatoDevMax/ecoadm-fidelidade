"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiTag,
  FiFilter,
  FiAlertCircle,
  FiLoader,
  FiX,
  FiCheck,
  FiDollarSign,
  FiImage,
  FiType,
  FiFileText,
  FiGrid,
  FiHash,
} from "react-icons/fi";
import { buscarProdutos, buscarCategoriasProdutos } from "../app/actions";
import { toast } from "react-hot-toast";

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  destaque: boolean;
  cod: string;
  ativado: boolean;
}

interface NovoProduto {
  id?: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  destaque: boolean;
  cod: string;
  ativado: boolean;
}

const produtoVazio: NovoProduto = {
  nome: "",
  descricao: "",
  preco: 0,
  categoria: "",
  imagem: "",
  destaque: false,
  cod: "",
  ativado: true,
};

// Função para adicionar novo produto (será criada no arquivo actions.ts)
const adicionarProduto = async (produto: NovoProduto) => {
  try {
    const response = await fetch("/api/produtos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(produto),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao adicionar produto");
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Erro ao adicionar produto:", error);
    return { success: false, error: error.message };
  }
};

// Função para atualizar produto existente
const atualizarProduto = async (produto: NovoProduto) => {
  try {
    const response = await fetch("/api/produtos", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(produto),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao atualizar produto");
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error);
    return { success: false, error: error.message };
  }
};

// Função para atualizar o destaque do produto
const atualizarDestaqueProduto = async (id: string, destaque: boolean) => {
  try {
    const response = await fetch("/api/produtos/destaque", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, destaque }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao atualizar destaque do produto");
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Erro ao atualizar destaque:", error);
    return { success: false, error: error.message };
  }
};

// Função para excluir produto
const excluirProduto = async (id: string) => {
  try {
    const response = await fetch(`/api/produtos`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao excluir produto");
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Erro ao excluir produto:", error);
    return { success: false, error: error.message };
  }
};

const PainelProdutos = () => {
  const [pesquisa, setPesquisa] = useState("");
  const [categorias, setCategorias] = useState<string[]>(["Todas"]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] =
    useState<NovoProduto>(produtoVazio);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [produtoExclusao, setProdutoExclusao] = useState<Produto | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Carregar categorias e produtos ao iniciar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);

        // Buscar categorias
        const resCategorias = await buscarCategoriasProdutos();
        if (resCategorias.success && resCategorias.data) {
          setCategorias(resCategorias.data);
        } else {
          setErro("Erro ao carregar categorias");
          setCategorias(["Todas"]);
        }

        // Buscar produtos
        const resProdutos = await buscarProdutos();
        if (resProdutos.success && resProdutos.data) {
          setProdutos(resProdutos.data as Produto[]);
        } else {
          setErro("Erro ao carregar produtos");
          setProdutos([]);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setErro("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Filtrar produtos quando pesquisa ou categoria mudar
  useEffect(() => {
    const realizarBusca = async () => {
      try {
        setLoading(true);
        const resultado = await buscarProdutos(pesquisa, categoriaFiltro);

        if (resultado.success && resultado.data) {
          setProdutos(resultado.data as Produto[]);
          setErro(null);
        } else {
          setErro("Erro ao filtrar produtos");
        }
      } catch (error) {
        console.error("Erro ao realizar busca:", error);
        setErro("Erro ao realizar busca");
      } finally {
        setLoading(false);
      }
    };

    // Pequeno debounce para evitar múltiplas requisições
    const timeoutId = setTimeout(() => {
      realizarBusca();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pesquisa, categoriaFiltro]);

  const abrirModalProduto = (produto?: Produto | null) => {
    if (produto) {
      setProdutoSelecionado({
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao || "",
        preco: produto.preco,
        categoria: produto.categoria || "",
        imagem: produto.imagem,
        destaque: produto.destaque,
        cod: produto.cod,
        ativado: produto.ativado,
      });
    } else {
      // Obter o próximo código disponível
      const ultimoCod =
        produtos.length > 0
          ? String(Math.max(...produtos.map((p) => parseInt(p.cod) || 0)) + 1)
          : "1";

      setProdutoSelecionado({
        ...produtoVazio,
        cod: ultimoCod,
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoSelecionado(produtoVazio);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setProdutoSelecionado((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === "preco" && type === "number") {
      setProdutoSelecionado((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    } else {
      setProdutoSelecionado((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const salvarProduto = async () => {
    try {
      setSalvando(true);

      // Validar campos obrigatórios
      if (!produtoSelecionado.nome) {
        toast.error("Nome é obrigatório");
        return;
      }

      if (produtoSelecionado.preco <= 0) {
        toast.error("Preço deve ser maior que zero");
        return;
      }

      if (!produtoSelecionado.imagem) {
        toast.error("URL da imagem é obrigatória");
        return;
      }

      if (!produtoSelecionado.cod) {
        toast.error("Código do produto é obrigatório");
        return;
      }

      // Verificar se é uma atualização ou uma criação
      const isAtualizacao = !!produtoSelecionado.id;

      // Enviar para a API
      const resultado = isAtualizacao
        ? await atualizarProduto(produtoSelecionado)
        : await adicionarProduto(produtoSelecionado);

      if (resultado.success) {
        toast.success(
          isAtualizacao
            ? "Produto atualizado com sucesso!"
            : "Produto adicionado com sucesso!"
        );

        // Atualizar a lista de produtos
        const novosProdutos = await buscarProdutos(pesquisa, categoriaFiltro);
        if (novosProdutos.success && novosProdutos.data) {
          setProdutos(novosProdutos.data as Produto[]);
        }

        fecharModal();
      } else {
        toast.error(
          resultado.error ||
            (isAtualizacao
              ? "Erro ao atualizar produto"
              : "Erro ao adicionar produto")
        );
      }
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      toast.error(error.message || "Erro ao salvar produto");
    } finally {
      setSalvando(false);
    }
  };

  const handleDestaqueChange = async (produto: Produto) => {
    try {
      const novoDestaque = !produto.destaque;

      // Atualiza localmente para feedback imediato
      setProdutos(
        produtos.map((p) =>
          p.id === produto.id ? { ...p, destaque: novoDestaque } : p
        )
      );

      // Envia para o servidor
      const resultado = await atualizarDestaqueProduto(
        produto.id,
        novoDestaque
      );

      if (!resultado.success) {
        // Reverte alteração local se falhar
        setProdutos(
          produtos.map((p) =>
            p.id === produto.id ? { ...p, destaque: produto.destaque } : p
          )
        );
        toast.error(
          `Erro ao ${
            novoDestaque ? "destacar" : "remover destaque do"
          } produto: ${resultado.error}`
        );
      } else {
        toast.success(
          `Produto ${
            novoDestaque ? "destacado" : "removido dos destaques"
          } com sucesso!`
        );
      }
    } catch (error: any) {
      console.error("Erro ao alterar destaque:", error);
      toast.error(error.message || "Erro ao alterar destaque");

      // Reverte a alteração local se houver qualquer erro
      setProdutos(
        produtos.map((p) =>
          p.id === produto.id ? { ...p, destaque: produto.destaque } : p
        )
      );
    }
  };

  // Verifica se uma imagem tem url válida
  const obterUrlImagem = (url: string) => {
    // Se for uma URL completa, use como está
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      return url;
    }

    // Caso contrário, use uma imagem padrão
    return "https://placehold.co/300x300/e5f7ed/1e915a?text=Produto+EcoClean";
  };

  const abrirModalExclusao = (produto: Produto) => {
    setProdutoExclusao(produto);
    setModalExclusaoAberto(true);
  };

  const fecharModalExclusao = () => {
    setModalExclusaoAberto(false);
    setProdutoExclusao(null);
  };

  const confirmarExclusao = async () => {
    if (!produtoExclusao) return;

    try {
      setExcluindo(true);

      const resultado = await excluirProduto(produtoExclusao.id);

      if (resultado.success) {
        // Remove o produto da lista local
        setProdutos(produtos.filter((p) => p.id !== produtoExclusao.id));
        toast.success("Produto excluído com sucesso!");
        fecharModalExclusao();
      } else {
        toast.error(`Erro ao excluir produto: ${resultado.error}`);
      }
    } catch (error: any) {
      console.error("Erro ao excluir produto:", error);
      toast.error(error.message || "Erro ao excluir produto");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="w-full">
      <header className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-indigo-900 mb-2"
        >
          Produtos Online
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.1 } }}
          className="text-gray-600"
        >
          Gerencie os produtos disponíveis na loja online da EcoClean
        </motion.p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6"
      >
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center mb-6">
          <div className="relative w-full md:w-auto flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="block w-full text-gray-700 pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-56">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="block w-full text-gray-700 pl-10 pr-3 py-2.5 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 appearance-none"
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => abrirModalProduto()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors duration-200 whitespace-nowrap"
            >
              <FiPlus size={18} />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <FiLoader className="animate-spin text-indigo-600 mr-2" size={24} />
            <span className="text-gray-600">Carregando produtos...</span>
          </div>
        ) : erro ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
            <FiAlertCircle />
            <span>{erro}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtos.length > 0 ? (
              produtos.map((produto) => (
                <motion.div
                  key={produto.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
                >
                  <div className="relative h-48 bg-gray-100 flex-shrink-0">
                    <div className="absolute top-2 right-2 z-10">
                      <label className="inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={produto.destaque}
                          onChange={() => handleDestaqueChange(produto)}
                          className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 shadow-sm transition-colors duration-200 cursor-pointer"
                        />
                        <span className="absolute opacity-0 group-hover:opacity-100 -top-7 right-0 bg-black bg-opacity-70 text-white text-xs rounded px-2 py-1 whitespace-nowrap transition-opacity duration-200">
                          {produto.destaque
                            ? "Remover destaque"
                            : "Destacar produto"}
                        </span>
                      </label>
                    </div>
                    <Image
                      src={obterUrlImagem(produto.imagem)}
                      alt={produto.nome}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="p-5 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {produto.nome}
                      </h3>
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                        {produto.categoria || "Sem categoria"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {produto.descricao || "Sem descrição"}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FiTag className="text-indigo-500" />
                        <span className="font-semibold text-indigo-700">
                          R$ {produto.preco.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModalProduto(produto)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => abrirModalExclusao(produto)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">
                          Código:{" "}
                          <span className="font-medium">{produto.cod}</span>
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            produto.destaque
                              ? "text-amber-600"
                              : "text-gray-500"
                          }`}
                        >
                          {produto.destaque ? "Destaque" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-10 text-center">
                <p className="text-gray-500">
                  Nenhum produto encontrado com os filtros selecionados.
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Modal de adicionar/editar produto */}
      <AnimatePresence>
        {modalAberto && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={fecharModal}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-0 w-full max-w-2xl z-50 relative mx-4"
            >
              <div className="bg-indigo-700 p-4 sm:p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    {produtoSelecionado.id ? "Editar Produto" : "Novo Produto"}
                  </h3>
                  <button
                    onClick={fecharModal}
                    className="text-white hover:text-indigo-200 transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Produto*
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiType className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="nome"
                        value={produtoSelecionado.nome}
                        onChange={handleInputChange}
                        className="block w-full text-gray-700 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                        placeholder="Digite o nome do produto"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-3 pointer-events-none">
                        <FiFileText className="text-gray-400" />
                      </div>
                      <textarea
                        name="descricao"
                        value={produtoSelecionado.descricao}
                        onChange={handleInputChange}
                        rows={3}
                        className="block w-full text-gray-700 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                        placeholder="Descreva o produto"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (R$)*
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="preco"
                        value={produtoSelecionado.preco}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="block w-full text-gray-700 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiGrid className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="categoria"
                        value={produtoSelecionado.categoria}
                        onChange={handleInputChange}
                        className="block w-full text-gray-700 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                        placeholder="Ex: Limpeza Geral"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL da Imagem*
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiImage className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="imagem"
                        value={produtoSelecionado.imagem}
                        onChange={handleInputChange}
                        className="block w-full text-gray-700 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                        placeholder="https://exemplo.com/imagem.jpg"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código do Produto*
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiHash className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="cod"
                        value={produtoSelecionado.cod}
                        onChange={handleInputChange}
                        className="block text-gray-700 w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                        placeholder="Código único"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        id="destaque"
                        name="destaque"
                        type="checkbox"
                        checked={produtoSelecionado.destaque}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-gray-700 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="destaque"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Produto em destaque
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="ativado"
                        name="ativado"
                        type="checkbox"
                        checked={produtoSelecionado.ativado}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="ativado"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Produto ativo
                      </label>
                    </div>
                  </div>
                </div>

                {produtoSelecionado.imagem && (
                  <div className="mb-4 border rounded-lg p-2 bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">
                      Pré-visualização da imagem:
                    </p>
                    <div className="relative h-40 w-full">
                      <Image
                        src={obterUrlImagem(produtoSelecionado.imagem)}
                        alt={produtoSelecionado.nome || "Prévia"}
                        fill
                        className="object-contain rounded-lg p-2"
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mb-4">
                  * Campos obrigatórios
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-b-xl flex justify-end gap-2">
                <button
                  onClick={fecharModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarProduto}
                  disabled={salvando}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  {salvando ? (
                    <>
                      <FiLoader className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      <span>Salvar Produto</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de confirmação de exclusão */}
      <AnimatePresence>
        {modalExclusaoAberto && produtoExclusao && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={fecharModalExclusao}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-0 w-full max-w-md z-50 relative mx-4"
            >
              <div className="bg-red-600 p-4 sm:p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    Confirmar Exclusão
                  </h3>
                  <button
                    onClick={fecharModalExclusao}
                    className="text-white hover:text-red-200 transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 relative flex-shrink-0">
                    <Image
                      src={obterUrlImagem(produtoExclusao.imagem)}
                      alt={produtoExclusao.nome}
                      fill
                      className="object-contain p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {produtoExclusao.nome}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Código: {produtoExclusao.cod}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Tem certeza que deseja excluir este produto? Esta ação não
                  pode ser desfeita.
                </p>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={fecharModalExclusao}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarExclusao}
                    disabled={excluindo}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    {excluindo ? (
                      <>
                        <FiLoader className="animate-spin" />
                        <span>Excluindo...</span>
                      </>
                    ) : (
                      <>
                        <FiTrash2 />
                        <span>Excluir Produto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PainelProdutos;
