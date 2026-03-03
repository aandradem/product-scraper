import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Edit2, Loader2, Trash2, Save, X, Star, Package, Truck, Tag } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProductDetailProps {
  id: string;
}

export default function ProductDetail({ id }: ProductDetailProps) {
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
      <div className="container mx-auto py-12">
        <Button variant="outline" onClick={() => setLocation("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card className="shadow-lg border-0">
          <CardContent className="py-12 text-center">
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
      <div className="container mx-auto py-12">
        <Button variant="outline" onClick={() => setLocation("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card className="shadow-lg border-0">
          <CardContent className="py-12 text-center">
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
  const reviews = product.reviews ? JSON.parse(product.reviews as string) : [];
  const dimensions = product.dimensions ? JSON.parse(product.dimensions as string) : {};

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
      dimensions,
      shippingTime: product.shippingTime,
      images,
      specifications: specs,
      nutritionalInfo: nutrition,
      variants,
      reviews,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="container mx-auto">
        <Button variant="outline" onClick={() => setLocation("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {!isEditing ? (
          <>
            {/* Header com informações principais */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {product.name || "Produto sem nome"}
                </h1>
                {product.brand && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    <Tag className="w-4 h-4 inline mr-2" />
                    {product.brand}
                  </p>
                )}
                <div className="flex gap-6 mb-4">
                  {product.price && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Preço</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {product.currency} {product.price}
                      </p>
                      {product.originalPrice && (
                        <p className="text-sm line-through text-gray-500">
                          {product.currency} {product.originalPrice}
                        </p>
                      )}
                    </div>
                  )}
                  {product.rating && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avaliação</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-2xl font-bold">{product.rating}</span>
                        {product.reviewCount && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({product.reviewCount} reviews)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </Button>
              </div>
            </div>

            {/* Informações VTEX */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {product.sku && (
                <Card className="shadow-lg border-0">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">SKU</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{product.sku}</p>
                  </CardContent>
                </Card>
              )}
              {product.availability && (
                <Card className="shadow-lg border-0">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Disponibilidade</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{product.availability}</p>
                  </CardContent>
                </Card>
              )}
              {product.category && (
                <Card className="shadow-lg border-0">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Categoria</p>
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{product.category}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Imagens */}
            {images.length > 0 && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Imagens do Produto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Imagem ${idx + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Descrição */}
            {product.description && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Informações de Envio */}
            {(product.weight || product.shippingTime || Object.keys(dimensions).length > 0) && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Informações de Envio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {product.weight && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Peso</p>
                        <p className="font-semibold">{product.weight}</p>
                      </div>
                    )}
                    {product.shippingTime && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tempo de Envio</p>
                        <p className="font-semibold">{product.shippingTime}</p>
                      </div>
                    )}
                    {Object.keys(dimensions).length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Dimensões</p>
                        <p className="font-semibold text-sm">
                          {dimensions.height && `A: ${dimensions.height}`}
                          {dimensions.width && ` x L: ${dimensions.width}`}
                          {dimensions.depth && ` x P: ${dimensions.depth}`}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Especificações */}
            {Object.keys(specs).length > 0 && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Especificações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações Nutricionais */}
            {Object.keys(nutrition).length > 0 && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Informações Nutricionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(nutrition).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key}</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Variantes */}
            {variants.length > 0 && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Variantes do Produto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {variants.map((variant: any, idx: number) => (
                      <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        {Object.entries(variant).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key}:</span>
                            <span className="font-semibold">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exportar */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Exportar Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={() => handleDownload("json")}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar JSON
                  </Button>
                  <Button onClick={() => handleDownload("csv")}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Modo Edição */
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Editar Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome</label>
                <Input
                  value={editData?.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Descrição</label>
                <Textarea
                  placeholder="Descrição"
                  value={editData?.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Preço</label>
                <Input
                  value={editData?.price || ""}
                  onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Preço Original</label>
                <Input
                  value={editData?.originalPrice || ""}
                  onChange={(e) => setEditData({ ...editData, originalPrice: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">SKU</label>
                <Input
                  value={editData?.sku || ""}
                  onChange={(e) => setEditData({ ...editData, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Marca</label>
                <Input
                  value={editData?.brand || ""}
                  onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Input
                  value={editData?.category || ""}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={handleSaveEdit} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
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
