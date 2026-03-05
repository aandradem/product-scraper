import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Edit2, Loader2, Trash2, Save, X, Star, Package, Truck, Tag, Copy, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ProductDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const productId = parseInt(id, 10);
  const isValidId = !isNaN(productId) && productId > 0;

  const productQuery = trpc.products.getById.useQuery(productId, {
    enabled: isValidId && isAuthenticated,
  });
  const updateMutation = trpc.products.update.useMutation();
  const deleteMutation = trpc.products.delete.useMutation();

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  if (!isValidId) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Button variant="outline" onClick={() => setLocation("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card className="shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">ID de produto inválido</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const product = productQuery.data;
  if (!product) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Button variant="outline" onClick={() => setLocation("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card className="shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Produto não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = product.images ? JSON.parse(product.images as string) : [];
  const specs = product.specifications ? JSON.parse(product.specifications as string) : {};
  const nutrition = product.nutritionalInfo ? JSON.parse(product.nutritionalInfo as string) : {};
  const variants = product.variants ? JSON.parse(product.variants as string) : [];

  const handleEdit = () => {
    setEditData({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      currency: product.currency,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      availability: product.availability,
      availabilityQuantity: product.availabilityQuantity,
      weight: product.weight,
      shippingTime: product.shippingTime,
      images: images,
      specifications: specs,
      nutritionalInfo: nutrition,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateMutation.mutateAsync(editData);
      toast.success("Produto atualizado com sucesso!");
      setIsEditing(false);
      productQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar");
    }
  };

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja deletar este produto?")) {
      try {
        await deleteMutation.mutateAsync(product.id);
        toast.success("Produto deletado com sucesso!");
        setLocation("/");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao deletar");
      }
    }
  };

  const handleDownload = (format: "json" | "csv") => {
    const dataToExport = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      currency: product.currency,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      availability: product.availability,
      availabilityQuantity: product.availabilityQuantity,
      rating: product.rating,
      reviewCount: product.reviewCount,
      weight: product.weight,
      shippingTime: product.shippingTime,
      images,
      specifications: specs,
      nutritionalInfo: nutrition,
      variants,
      sourceUrl: product.sourceUrl,
      createdAt: product.createdAt,
    };

    if (format === "json") {
      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `produto-${product.id}.json`;
      a.click();
    } else if (format === "csv") {
      let csv = "Campo,Valor\n";
      csv += `Nome,"${product.name || ""}"\n`;
      csv += `Descrição,"${(product.description || "").replace(/"/g, '""')}"\n`;
      csv += `Preço,${product.price || ""}\n`;
      csv += `Preço Original,${product.originalPrice || ""}\n`;
      csv += `Moeda,${product.currency || ""}\n`;
      csv += `SKU,${product.sku || ""}\n`;
      csv += `Categoria,${product.category || ""}\n`;
      csv += `Marca,${product.brand || ""}\n`;
      csv += `Disponibilidade,${product.availability || ""}\n`;
      csv += `Quantidade,${product.availabilityQuantity || ""}\n`;
      csv += `Avaliação,${product.rating || ""}\n`;
      csv += `Número de Reviews,${product.reviewCount || ""}\n`;
      csv += `Peso,${product.weight || ""}\n`;
      csv += `Tempo de Envio,${product.shippingTime || ""}\n`;
      csv += `Imagens,${images.length}\n`;
      csv += `Especificações,${Object.keys(specs).length}\n`;
      csv += `Informações Nutricionais,${Object.keys(nutrition).length}\n`;
      csv += `Variantes,${variants.length}\n`;

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `produto-${product.id}.csv`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button variant="outline" onClick={() => setLocation("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {!isEditing ? (
          <>
            {/* Header Principal */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Imagens */}
                <div className="lg:w-1/3">
                  {images.length > 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                      <img
                        src={images[0] || ''}
                        alt={product.name || 'Produto'}
                        className="w-full h-96 object-cover"
                      />
                      {images.length > 1 && (
                        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {images.length} imagens disponíveis
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {images.slice(0, 3).map((img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`${product.name || 'Produto'} ${idx + 1}`}
                                className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-200 dark:bg-slate-700 rounded-xl h-96 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Informações Principais */}
                <div className="lg:w-2/3">
                  <div className="mb-6">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {product.name || "Produto sem nome"}
                    </h1>
                    {product.brand && (
                      <p className="text-lg text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        {product.brand}
                      </p>
                    )}
                    {product.category && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        Categoria: {product.category}
                      </p>
                    )}
                  </div>

                  {/* Preço e Avaliação */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {product.price && (
                      <Card className="shadow-lg border-0">
                        <CardContent className="pt-6">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preço</p>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {product.currency} {product.price}
                          </p>
                          {product.originalPrice && (
                            <p className="text-sm line-through text-gray-500 mt-1">
                              {product.currency} {product.originalPrice}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    {product.rating && (
                      <Card className="shadow-lg border-0">
                        <CardContent className="pt-6">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avaliação</p>
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="text-2xl font-bold">{product.rating}</span>
                          </div>
                          {product.reviewCount && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {product.reviewCount} reviews
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* SKU e Disponibilidade */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {product.sku && (
                      <Card className="shadow-lg border-0">
                        <CardContent className="pt-6">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">SKU</p>
                          <p className="font-mono font-semibold text-gray-900 dark:text-white break-all">
                            {product.sku}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {product.availability && (
                      <Card className="shadow-lg border-0">
                        <CardContent className="pt-6">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Disponibilidade</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {product.availability}
                          </p>
                          {product.availabilityQuantity && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {product.availabilityQuantity} unidades
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Peso e Envio */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {product.weight && (
                      <Card className="shadow-lg border-0">
                        <CardContent className="pt-6">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Peso</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{product.weight}</p>
                        </CardContent>
                      </Card>
                    )}
                    {product.shippingTime && (
                      <Card className="shadow-lg border-0">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Envio</p>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white">{product.shippingTime}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" onClick={() => handleDownload("json")}>
                      <Download className="w-4 h-4 mr-2" />
                      JSON
                    </Button>
                    <Button variant="outline" onClick={() => handleDownload("csv")}>
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Descrição */}
            {product.description && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle>Descrição do Produto</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Especificações */}
            {Object.keys(specs).length > 0 && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle>Especificações Técnicas</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-200 dark:border-slate-700 pb-3">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{key}</p>
                        <p className="text-gray-900 dark:text-white mt-1">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações Nutricionais */}
            {Object.keys(nutrition).length > 0 && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                  <CardTitle>Informações Nutricionais</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(nutrition).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-200 dark:border-slate-700 pb-3">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{key}</p>
                        <p className="text-gray-900 dark:text-white mt-1">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Variantes */}
            {variants.length > 0 && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
                  <CardTitle>Variantes do Produto</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {variants.map((variant: any, idx: number) => (
                      <Card key={idx} className="border-0 bg-gray-50 dark:bg-slate-700">
                        <CardContent className="pt-6">
                          <p className="font-semibold text-gray-900 dark:text-white mb-2">
                            Variante {idx + 1}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {JSON.stringify(variant, null, 2)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* URL de Origem */}
            {product.sourceUrl && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-sm">URL de Origem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-slate-700 rounded">
                    <input
                      type="text"
                      value={product.sourceUrl}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(product.sourceUrl);
                        toast.success("URL copiada!");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Modo Edição */
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle>Editar Produto</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nome</label>
                <Input
                  value={editData?.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Descrição</label>
                <Textarea
                  value={editData?.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="mt-2 h-32"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preço</label>
                  <Input
                    value={editData?.price || ""}
                    onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preço Original</label>
                  <Input
                    value={editData?.originalPrice || ""}
                    onChange={(e) => setEditData({ ...editData, originalPrice: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">SKU</label>
                  <Input
                    value={editData?.sku || ""}
                    onChange={(e) => setEditData({ ...editData, sku: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Categoria</label>
                  <Input
                    value={editData?.category || ""}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
