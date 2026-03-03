import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, TrendingUp, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function QualityDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: analysis, isLoading, error } = trpc.quality.getQualityAnalysis.useQuery();

  if (!user) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Erro ao carregar dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">{error?.message || "Não foi possível carregar os dados de qualidade"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const distributionData = [
    { name: "Excelente (80-100)", value: analysis.distribution.excellent, fill: "#10b981" },
    { name: "Bom (60-80)", value: analysis.distribution.good, fill: "#3b82f6" },
    { name: "Razoável (40-60)", value: analysis.distribution.fair, fill: "#f59e0b" },
    { name: "Ruim (0-40)", value: analysis.distribution.poor, fill: "#ef4444" },
  ];

  const scoreRangeData = [
    { range: "0-20", count: analysis.scoreDistribution["0-20"] },
    { range: "20-40", count: analysis.scoreDistribution["20-40"] },
    { range: "40-60", count: analysis.scoreDistribution["40-60"] },
    { range: "60-80", count: analysis.scoreDistribution["60-80"] },
    { range: "80-100", count: analysis.scoreDistribution["80-100"] },
  ];

  const fieldData = analysis.fieldAverages.slice(0, 10).map(field => ({
    field: field.field.substring(0, 15),
    score: field.averageScore,
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getConfidenceBadge = (confidence: "low" | "medium" | "high") => {
    switch (confidence) {
      case "high":
        return <Badge className="bg-emerald-100 text-emerald-800">Alta</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800">Média</Badge>;
      case "low":
        return <Badge className="bg-rose-100 text-rose-800">Baixa</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Dashboard de Qualidade</h1>
            <p className="text-slate-600 mt-2">Análise completa da qualidade dos dados extraídos</p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            ← Voltar
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{analysis.totalProducts}</div>
              <p className="text-xs text-slate-500 mt-2">Produtos analisados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Score Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(analysis.statistics.averageScore).split(" ")[0]}`}>
                {analysis.statistics.averageScore}%
              </div>
              <p className="text-xs text-slate-500 mt-2">Qualidade geral</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Score Máximo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{analysis.statistics.maxScore}%</div>
              <p className="text-xs text-slate-500 mt-2">Melhor produto</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Score Mínimo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{analysis.statistics.minScore}%</div>
              <p className="text-xs text-slate-500 mt-2">Produto com menor qualidade</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Qualidade</CardTitle>
              <CardDescription>Produtos por faixa de qualidade</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Score Range Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Scores</CardTitle>
              <CardDescription>Quantidade de produtos por faixa de score</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreRangeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Field Quality */}
        <Card>
          <CardHeader>
            <CardTitle>Qualidade por Campo</CardTitle>
            <CardDescription>Score médio de cada campo extraído</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fieldData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="field" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="score" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Problematic Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Produtos Problemáticos
            </CardTitle>
            <CardDescription>Produtos com score abaixo de 60%</CardDescription>
          </CardHeader>
          <CardContent>
            {analysis.problematicProducts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-slate-600">Excelente! Todos os produtos têm boa qualidade.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analysis.problematicProducts.map((product) => (
                  <div key={product.productId} className={`p-4 rounded-lg border ${getScoreColor(product.overallScore)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{product.productName || "Produto sem nome"}</h3>
                        <p className="text-sm opacity-75 mt-1">{product.sourceUrl}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{product.overallScore}%</div>
                        <p className="text-xs opacity-75">Qualidade baixa</p>
                      </div>
                    </div>

                    {product.criticalIssues.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                        <p className="text-sm font-semibold mb-2">Problemas críticos:</p>
                        <ul className="text-sm space-y-1">
                          {product.criticalIssues.slice(0, 3).map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {product.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-semibold mb-2">Avisos:</p>
                        <ul className="text-sm space-y-1">
                          {product.warnings.slice(0, 2).map((warning, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={() => navigate(`/product/${product.productId}`)}
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                    >
                      Ver detalhes →
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Resumo da Análise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-slate-700">
              <span className="font-semibold text-green-600">{analysis.distribution.excellent}</span> produtos com qualidade excelente (80-100%)
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-blue-600">{analysis.distribution.good}</span> produtos com boa qualidade (60-80%)
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-amber-600">{analysis.distribution.fair}</span> produtos com qualidade razoável (40-60%)
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-red-600">{analysis.distribution.poor}</span> produtos com qualidade ruim (0-40%)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
