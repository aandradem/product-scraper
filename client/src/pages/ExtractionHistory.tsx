import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, RotateCcw, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ExtractionHistory() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const pageSize = 20;

  const historyQuery = trpc.products.history.list.useQuery(
    { limit: pageSize, offset: currentPage * pageSize },
    { enabled: isAuthenticated }
  );

  const filteredItems = useMemo(() => {
    if (!historyQuery.data?.items) return [];
    return historyQuery.data.items.filter(item => {
      const matchesSearch = item.sourceUrl.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [historyQuery.data?.items, searchQuery, filterStatus]);

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  };

  const totalPages = Math.ceil((historyQuery.data?.total || 0) / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="shadow-lg border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">Histórico de Extrações</CardTitle>
            <CardDescription>
              Visualize todas as suas extrações de produtos e reextraia URLs que falharam
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder="Buscar por URL..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            className="md:col-span-2"
          />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          >
            <option value="all">Todos os Status</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
            <option value="pending">Pendente</option>
          </select>
        </div>

        {historyQuery.isLoading ? (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">Carregando histórico...</p>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Nenhuma extração encontrada</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className={`shadow-md border ${getStatusColor(item.status)}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(item.status)}
                          <span className="font-semibold text-sm capitalize">
                            {item.status === "success" ? "Sucesso" : item.status === "error" ? "Erro" : "Pendente"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-all truncate">
                          {item.sourceUrl}
                        </p>
                        {item.errorMessage && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                            Erro: {item.errorMessage}
                          </p>
                        )}
                        {item.productId && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Produto ID: {item.productId}
                          </p>
                        )}
                      </div>
                      {item.status === "error" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast.success("Reextraçãoiniciada!");
                          }}
                          className="whitespace-nowrap"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Reextrair
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  Anterior
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Página {currentPage + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
