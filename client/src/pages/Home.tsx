import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Link as LinkIcon, Database, Download, Edit2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const scrapeProductMutation = trpc.products.scrape.useMutation();
  const productsQuery = trpc.products.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

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

        {/* Products List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Produtos Extraídos
          </h2>

          {productsQuery.isLoading ? (
            <Card className="shadow-lg border-0">
              <CardContent className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </CardContent>
            </Card>
          ) : productsQuery.data && productsQuery.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsQuery.data.map((product) => (
                <Card
                  key={product.id}
                  className="shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => setLocation(`/product/${product.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2 text-lg">
                          {product.productName || "Produto sem nome"}
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
                    {product.productDescription && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                        {product.productDescription}
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-lg border-0">
              <CardContent className="py-12 text-center">
                <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum produto extraído ainda. Comece inserindo uma URL acima!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
