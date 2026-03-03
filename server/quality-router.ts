import { publicProcedure, router } from "./_core/trpc";

export const qualityRouter = router({
  getQualityAnalysis: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Unauthorized");
    const { getUserProducts } = await import("./db");
    const { generateQualityReport } = await import("./validation");
    
    const products = await getUserProducts(ctx.user.id);
    const reports = products.map(product => {
      const extractedData = product.extractedData ? JSON.parse(product.extractedData) : {};
      const report = generateQualityReport(extractedData);
      return { 
        productId: product.id, 
        productName: product.name,
        sourceUrl: product.sourceUrl,
        ...report 
      };
    });
    
    // Calculate statistics
    const scores = reports.map(r => r.overallScore);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    
    // Categorize products by quality
    const excellent = reports.filter(r => r.overallScore >= 80).length;
    const good = reports.filter(r => r.overallScore >= 60 && r.overallScore < 80).length;
    const fair = reports.filter(r => r.overallScore >= 40 && r.overallScore < 60).length;
    const poor = reports.filter(r => r.overallScore < 40).length;
    
    // Get problematic products
    const problematicProducts = reports
      .filter(r => r.overallScore < 60)
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 10);
    
    // Get score distribution for chart
    const scoreDistribution = {
      "0-20": reports.filter(r => r.overallScore >= 0 && r.overallScore < 20).length,
      "20-40": reports.filter(r => r.overallScore >= 20 && r.overallScore < 40).length,
      "40-60": reports.filter(r => r.overallScore >= 40 && r.overallScore < 60).length,
      "60-80": reports.filter(r => r.overallScore >= 60 && r.overallScore < 80).length,
      "80-100": reports.filter(r => r.overallScore >= 80 && r.overallScore <= 100).length,
    };
    
    // Get field quality summary
    const fieldQualitySummary: Record<string, number> = {};
    reports.forEach(report => {
      Object.entries(report.fieldScores).forEach(([field, fieldScore]) => {
        if (!fieldQualitySummary[field]) {
          fieldQualitySummary[field] = 0;
        }
        fieldQualitySummary[field] += fieldScore.score;
      });
    });
    
    // Calculate average score per field
    const fieldAverages = Object.entries(fieldQualitySummary).map(([field, totalScore]) => ({
      field,
      averageScore: Math.round(totalScore / reports.length),
    })).sort((a, b) => a.averageScore - b.averageScore);
    
    return {
      totalProducts: reports.length,
      statistics: {
        averageScore: avgScore,
        minScore,
        maxScore,
      },
      distribution: {
        excellent,
        good,
        fair,
        poor,
      },
      scoreDistribution,
      fieldAverages,
      problematicProducts,
      allReports: reports,
    };
  }),
});
