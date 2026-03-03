import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Link as LinkIcon, Database, Download, Edit2, Upload, Copy, Trash2, Search } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [csvUrls, setCsvUrls] = useState<string[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  
  const scrapeProductMutation = trpc.products.scrape.useMutation();
  const searchQuery_ = trpc.products.search.useQuery(
    { query: searchQuery },
    { enabled: isAuthenticated && searchQuery.length > 0 }
  );
  const productsQuery = trpc.products.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const batchScrapeMutation = trpc.products.batchScrape.useMutation();

  const displayedProducts = searchQuery && searchQuery.length > 0 ? searchQuery_.data || [] : productsQuery.data || [];

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error("Por favor, insira uma URL válida");
      return;
    }

    setIsLoading(true);
    try {
      const result = await scrapeProductMutation.mutateAsync({ url });
      toast.success("Produto extraído com sucesso!");
      setUrl("");
      productsQuery.refetch();
      setLocation(`/product/${result.product?.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao extrair produto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const urls = text
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.length > 0 && line.startsWith("http"));

        if (urls.length === 0) {
          toast.error("Nenhuma URL válida encontrada no CSV");
          return;
        }

        setIsBatchLoading(true);
        setBatchProgress(0);

        const result = await batchScrapeMutation.mutateAsync(urls);
        
        toast.success(`${result.success.length} produtos extraídos com sucesso!`);
        if (result.failed.length > 0) {
          toast.error(`${result.failed.length} URLs falharam`);
        }

        productsQuery.refetch();
        setCsvUrls([]);
      } catch (error) {
        toast.error("Erro ao processar importação em lote");
      } finally {
        setIsBatchLoading(false);
        setBatchProgress(0);
      }
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Product Scraper
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Extraia informações de produtos de e-commerce com inteligência artificial
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                <LinkIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Insira a URL</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">De qualquer página de produto</p>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">IA Extrai Dados</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Análise inteligente com LLM</p>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                <Database className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Salve e Exporte</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">JSON, CSV e mais formatos</p>
              </div>
            </div>

            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Começar Agora
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Product Scraper
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bem-vindo, {user?.name}! Extraia informações de produtos com IA.
          </p>
        </div>

        {/* Scraping Form */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Extrair Novo Produto
            </CardTitle>
            <CardDescription className="text-blue-100">
              Cole a URL de um produto de e-commerce e deixe a IA extrair os dados
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleScrape} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://exemplo.com/produto/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extraindo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Extrair
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Exemplos: Amazon, eBay, Mercado Livre, Shopify, WooCommerce, etc.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Batch Import */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Importação em Lote
            </CardTitle>
            <CardDescription className="text-purple-100">
              Faça upload de um CSV com múltiplas URLs para scraping paralelo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                disabled={isBatchLoading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
              />
              {isBatchLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processando...</span>
                    <span>{batchProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${batchProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Formato: Uma URL por linha (máximo 50 URLs)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Search className="w-5 h-5 text-gray-400 mt-3" />
              <Input
                type="text"
                placeholder="Buscar produtos por nome, SKU ou marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {searchQuery ? "Resultados da Busca" : "Produtos Extraídos"}
          </h2>

          {productsQuery.isLoading ? (
            <Card className="shadow-lg border-0">
              <CardContent className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </CardContent>
            </Card>
          ) : displayedProducts && displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="shadow-lg border-0 hover:shadow-xl transition-shadow overflow-hidden"
                >
                  <CardHeader className="pb-3 cursor-pointer" onClick={() => setLocation(`/product/${product.id}`)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2 text-lg">
                          {product.name || "Produto sem nome"}
                        </CardTitle>
                        {product.price && (
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">
                            {product.currency} {product.price}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.status === "success"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : product.status === "error"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {product.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mb-4">
                      {product.images && JSON.parse(product.images as string).length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {JSON.parse(product.images as string).length} imagens
                        </div>
                      )}
                      {product.specifications && Object.keys(JSON.parse(product.specifications as string)).length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {Object.keys(JSON.parse(product.specifications as string)).length} specs
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setLocation(`/product/${product.id}`)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-lg border-0">
              <CardContent className="py-12 text-center">
                <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto extraído ainda. Comece inserindo uma URL acima!"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
