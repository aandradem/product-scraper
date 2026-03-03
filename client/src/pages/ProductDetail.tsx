import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Edit2, Loader2, Trash2, Save, X } from "lucide-react";
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

  const handleEdit = () => {
    setEditData({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
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
      currency: product.currency,
      images,
      specifications: specs,
      nutritionalInfo: nutrition,
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
      csv += `Moeda,${product.currency || ""}\n`;
      csv += `Imagens,${images.length}\n`;
      csv += `Especificações,${Object.keys(specs).length}\n`;
      csv += `Informações Nutricionais,${Object.keys(nutrition).length}\n`;

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
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {product.name || "Produto sem nome"}
                </h1>
                {product.price && (
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {product.currency} {product.price}
                  </p>
                )}
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

            {/* Images */}
            {images.length > 0 && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Imagens do Produto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img: string, idx: number) => (
                      <div key={idx} className="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden aspect-square">
                        <img
                          src={img}
                          alt={`Imagem ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EImagem inválida%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
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

            {/* Specifications */}
            {Object.keys(specs).length > 0 && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Especificações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{key}</span>
                        <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nutritional Info */}
            {Object.keys(nutrition).length > 0 && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Informações Nutricionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(nutrition).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{key}</span>
                        <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meta Tags */}
            {(product.metaTitle || product.metaDescription || product.metaKeywords) && (
              <Card className="mb-8 shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Meta Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.metaTitle && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Title</p>
                      <p className="text-gray-900 dark:text-white">{product.metaTitle}</p>
                    </div>
                  )}
                  {product.metaDescription && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Description</p>
                      <p className="text-gray-900 dark:text-white">{product.metaDescription}</p>
                    </div>
                  )}
                  {product.metaKeywords && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Keywords</p>
                      <p className="text-gray-900 dark:text-white">{product.metaKeywords}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Export */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Exportar Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={() => handleDownload("json")} className="bg-blue-600 hover:bg-blue-700">
                    <Download className="w-4 h-4 mr-2" />
                    JSON
                  </Button>
                  <Button onClick={() => handleDownload("csv")} className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Edit Mode */
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle>Editar Produto</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Nome</label>
                  <Input
                    value={editData.name || ""}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Preço</label>
                    <Input
                      value={editData.price || ""}
                      onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Moeda</label>
                    <Input
                      value={editData.currency || ""}
                      onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Descrição</label>
                <Textarea
                  value={editData.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="flex-1"
                >
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
