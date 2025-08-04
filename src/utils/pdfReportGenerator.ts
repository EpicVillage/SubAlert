import jsPDF from 'jspdf';
import { API, Category } from '../types';
import { format } from 'date-fns';
import Chart from 'chart.js/auto';

export interface PDFReportOptions {
  type: 'summary' | 'detailed' | 'financial' | 'renewal' | 'category';
  includeCharts?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  selectedCategories?: string[];
  selectedApis?: string[];
  includeNotes?: boolean;
  pageSize?: 'a4' | 'letter';
  title?: string;
  subtitle?: string;
}

export class PDFReportGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private primaryColor: string = '#2563eb';
  private textColor: string = '#111111';
  private lightGray: string = '#f5f5f5';
  private darkGray: string = '#666666';
  private logoBase64: string = '';

  constructor(options: PDFReportOptions) {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: options.pageSize || 'a4'
    });
    
    this.currentY = 20;
    this.margin = 20;
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - (2 * this.margin);
  }

  async generateReport(
    apis: API[], 
    categories: Category[], 
    options: PDFReportOptions
  ): Promise<Blob> {
    // Add header
    this.addHeader(options);
    
    // Filter APIs based on options
    let filteredApis = this.filterApis(apis, options);
    
    // Generate report based on type
    switch (options.type) {
      case 'summary':
        await this.generateSummaryReport(filteredApis, categories, options);
        break;
      case 'detailed':
        await this.generateDetailedReport(filteredApis, categories, options);
        break;
      case 'financial':
        await this.generateFinancialReport(filteredApis, categories, options);
        break;
      case 'renewal':
        await this.generateRenewalReport(filteredApis, categories, options);
        break;
      case 'category':
        await this.generateCategoryReport(filteredApis, categories, options);
        break;
    }
    
    // Add footer to all pages
    this.addFooterToAllPages();
    
    return this.pdf.output('blob');
  }

  private filterApis(apis: API[], options: PDFReportOptions): API[] {
    let filtered = [...apis];
    
    // Filter by selected APIs
    if (options.selectedApis && options.selectedApis.length > 0) {
      filtered = filtered.filter(api => options.selectedApis!.includes(api.id));
    }
    
    // Filter by selected categories
    if (options.selectedCategories && options.selectedCategories.length > 0) {
      filtered = filtered.filter(api => options.selectedCategories!.includes(api.category));
    }
    
    // Filter by date range
    if (options.dateRange) {
      filtered = filtered.filter(api => {
        if (!api.expiryDate) return true;
        const expiryDate = new Date(api.expiryDate);
        return expiryDate >= options.dateRange!.start && expiryDate <= options.dateRange!.end;
      });
    }
    
    return filtered;
  }

  private addHeader(options: PDFReportOptions) {
    // Add watermark to first page
    this.addWatermarkToPage(1);
    
    // Add logo placeholder
    this.pdf.setFillColor(this.primaryColor);
    this.pdf.circle(this.margin + 10, this.currentY + 10, 10, 'F');
    
    // Add title
    this.pdf.setFontSize(24);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text(options.title || 'SubAlerts Report', this.margin + 25, this.currentY + 8);
    
    // Add subtitle
    if (options.subtitle) {
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(this.darkGray);
      this.pdf.text(options.subtitle, this.margin + 25, this.currentY + 15);
    }
    
    // Add date
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(this.darkGray);
    const dateText = `Generated on ${format(new Date(), 'MMMM dd, yyyy')}`;
    const textWidth = this.pdf.getTextWidth(dateText);
    this.pdf.text(
      dateText,
      this.pageWidth - this.margin - textWidth,
      this.currentY + 8
    );
    
    this.currentY += 30;
    
    // Add separator line
    this.pdf.setDrawColor(this.lightGray);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private async generateSummaryReport(apis: API[], categories: Category[], options: PDFReportOptions) {
    // Add summary statistics
    this.addSummaryStatistics(apis, categories);
    
    // Add charts if enabled
    if (options.includeCharts) {
      await this.addCategoryPieChart(apis, categories);
      await this.addMonthlyCostChart(apis);
    }
    
    // Add subscription list
    this.addSubscriptionList(apis, categories, true);
  }

  private async generateDetailedReport(apis: API[], categories: Category[], options: PDFReportOptions) {
    // Add summary statistics
    this.addSummaryStatistics(apis, categories);
    
    // Start detailed subscriptions on a new page
    this.addNewPage();
    
    // Add section title for subscriptions
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text('Detailed Subscriptions', this.margin, this.currentY);
    this.currentY += 15;
    
    // Add detailed subscription information
    apis.forEach((api, index) => {
      if (index > 0 && this.currentY > this.pageHeight - 80) {
        this.addNewPage();
      }
      this.addDetailedSubscription(api, categories, options.includeNotes);
    });
  }

  private async generateFinancialReport(apis: API[], categories: Category[], options: PDFReportOptions) {
    // Add financial summary
    this.addFinancialSummary(apis, categories);
    
    // Add charts
    if (options.includeCharts) {
      await this.addCategoryPieChart(apis, categories);
      await this.addMonthlyCostChart(apis);
      await this.addYearlyCostProjection(apis);
    }
    
    // Add cost breakdown by category
    this.addCostBreakdownByCategory(apis, categories);
  }

  private async generateRenewalReport(apis: API[], categories: Category[], options: PDFReportOptions) {
    // Sort by renewal date
    const sortedApis = [...apis].sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
    
    // Add upcoming renewals summary
    this.addUpcomingRenewalsSummary(sortedApis);
    
    // Add renewal calendar if charts enabled
    if (options.includeCharts) {
      await this.addRenewalCalendar(sortedApis);
    }
    
    // Add renewal list
    this.addRenewalList(sortedApis, categories);
  }

  private async generateCategoryReport(apis: API[], categories: Category[], options: PDFReportOptions) {
    // Group by category
    const groupedApis = this.groupApisByCategory(apis, categories);
    
    // Add category summary
    this.addCategorySummary(groupedApis, categories);
    
    // Add charts if enabled
    if (options.includeCharts) {
      await this.addCategoryPieChart(apis, categories);
    }
    
    // Add subscriptions grouped by category
    Object.entries(groupedApis).forEach(([categoryId, categoryApis]) => {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        this.addCategorySection(category, categoryApis);
      }
    });
  }

  private addSummaryStatistics(apis: API[], categories: Category[]) {
    const stats = this.calculateStatistics(apis);
    
    // Add section title
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text('Summary Statistics', this.margin, this.currentY);
    this.currentY += 10;
    
    // Create stats grid
    const statsData = [
      { label: 'Total Subscriptions', value: stats.total.toString() },
      { label: 'Active Subscriptions', value: stats.active.toString() },
      { label: 'Monthly Cost', value: `$${stats.monthlyCost.toFixed(2)}` },
      { label: 'Yearly Cost', value: `$${stats.yearlyCost.toFixed(2)}` },
      { label: 'Expiring Soon', value: stats.expiringSoon.toString() },
      { label: 'Categories', value: stats.categoriesUsed.toString() }
    ];
    
    const boxWidth = (this.contentWidth - 20) / 3;
    const boxHeight = 25;
    
    statsData.forEach((stat, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = this.margin + (col * (boxWidth + 10));
      const y = this.currentY + (row * (boxHeight + 10));
      
      // Draw box
      this.pdf.setFillColor(this.lightGray);
      this.pdf.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F');
      
      // Add label
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(this.darkGray);
      this.pdf.text(stat.label, x + 5, y + 8);
      
      // Add value
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(this.textColor);
      this.pdf.text(stat.value, x + 5, y + 18);
    });
    
    this.currentY += (Math.ceil(statsData.length / 3) * (boxHeight + 10)) + 20;
  }

  private calculateStatistics(apis: API[]) {
    const active = apis.filter(api => {
      if (!api.expiryDate) return true;
      return new Date(api.expiryDate) > new Date();
    });
    
    const expiringSoon = apis.filter(api => {
      if (!api.expiryDate) return false;
      const daysLeft = Math.ceil((new Date(api.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft <= 30;
    });
    
    const monthlyCost = apis.reduce((total, api) => {
      if (api.subscriptionType === 'paid' && api.cost) {
        const monthlyCost = api.billingCycle === 'yearly' ? api.cost / 12 : api.cost;
        return total + monthlyCost;
      }
      return total;
    }, 0);
    
    const yearlyCost = apis.reduce((total, api) => {
      if (api.subscriptionType === 'paid' && api.cost) {
        const yearlyCost = api.billingCycle === 'monthly' ? api.cost * 12 : api.cost;
        return total + yearlyCost;
      }
      return total;
    }, 0);
    
    const categoriesUsed = new Set(apis.map(api => api.category)).size;
    
    return {
      total: apis.length,
      active: active.length,
      monthlyCost,
      yearlyCost,
      expiringSoon: expiringSoon.length,
      categoriesUsed
    };
  }

  private addSubscriptionList(apis: API[], categories: Category[], summary: boolean = false) {
    // Add section title
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text('Subscriptions', this.margin, this.currentY);
    this.currentY += 10;
    
    // Add table header
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(this.darkGray);
    const headers = summary 
      ? ['Service', 'Category', 'Cost', 'Next Renewal']
      : ['Service', 'Category', 'Email', 'Cost', 'Billing', 'Next Renewal'];
    
    const colWidths = summary
      ? [70, 50, 35, 35]  // Adjusted widths to prevent overlap
      : [40, 30, 50, 30, 30, 40];
    
    let xPos = this.margin;
    headers.forEach((header, index) => {
      this.pdf.text(header, xPos, this.currentY);
      xPos += colWidths[index];
    });
    
    this.currentY += 5;
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 5;
    
    // Add table rows
    this.pdf.setFontSize(9);
    apis.forEach(api => {
      if (this.currentY > this.pageHeight - 30) {
        this.addNewPage();
      }
      
      const category = categories.find(c => c.id === api.category);
      xPos = this.margin;
      
      this.pdf.setTextColor(this.textColor);
      if (summary) {
        this.pdf.text(this.truncateText(api.serviceName, 25), xPos, this.currentY);
        xPos += colWidths[0];
        
        this.pdf.text(category ? category.name : 'Other', xPos, this.currentY);
        xPos += colWidths[1];
        
        if (api.subscriptionType === 'paid' && api.cost) {
          this.pdf.text(`$${api.cost}/${api.billingCycle === 'yearly' ? 'yr' : 'mo'}`, xPos, this.currentY);
        } else {
          this.pdf.text('Free', xPos, this.currentY);
        }
        xPos += colWidths[2];
        
        if (api.expiryDate) {
          this.pdf.text(format(new Date(api.expiryDate), 'MMM dd, yyyy'), xPos, this.currentY);
        } else {
          this.pdf.text('-', xPos, this.currentY);
        }
      } else {
        // Detailed view
        this.pdf.text(this.truncateText(api.serviceName, 20), xPos, this.currentY);
        xPos += colWidths[0];
        
        this.pdf.text(category ? category.name : 'Other', xPos, this.currentY);
        xPos += colWidths[1];
        
        this.pdf.text(this.truncateText(api.email, 25), xPos, this.currentY);
        xPos += colWidths[2];
        
        if (api.subscriptionType === 'paid' && api.cost) {
          this.pdf.text(`$${api.cost}`, xPos, this.currentY);
        } else {
          this.pdf.text('Free', xPos, this.currentY);
        }
        xPos += colWidths[3];
        
        if (api.subscriptionType === 'paid') {
          this.pdf.text(api.billingCycle || '-', xPos, this.currentY);
        } else {
          this.pdf.text('-', xPos, this.currentY);
        }
        xPos += colWidths[4];
        
        if (api.expiryDate) {
          this.pdf.text(format(new Date(api.expiryDate), 'MM/dd/yy'), xPos, this.currentY);
        } else {
          this.pdf.text('-', xPos, this.currentY);
        }
      }
      
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  private async addCategoryPieChart(apis: API[], categories: Category[]) {
    const categoryData = this.groupApisByCategory(apis, categories);
    
    // Create canvas for chart
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    document.body.appendChild(canvas);
    
    try {
      const chartData = {
        labels: Object.keys(categoryData).map(catId => {
          const category = categories.find(c => c.id === catId);
          return category ? category.name : 'Other';
        }),
        datasets: [{
          data: Object.values(categoryData).map(apis => apis.length),
          backgroundColor: Object.keys(categoryData).map(catId => {
            const category = categories.find(c => c.id === catId);
            return category ? category.color : '#6b7280';
          })
        }]
      };
      
      const chart = new Chart(canvas, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: false,
          plugins: {
            legend: {
              position: 'right'
            },
            title: {
              display: true,
              text: 'Subscriptions by Category'
            }
          }
        }
      });
      
      // Wait for chart to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Add chart to PDF
      const imgData = canvas.toDataURL('image/png');
      this.pdf.addImage(imgData, 'PNG', this.margin, this.currentY, 100, 75);
      this.currentY += 85;
      
      chart.destroy();
    } finally {
      document.body.removeChild(canvas);
    }
  }

  private groupApisByCategory(apis: API[], categories: Category[]): Record<string, API[]> {
    return apis.reduce((groups, api) => {
      const categoryId = api.category || 'other';
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(api);
      return groups;
    }, {} as Record<string, API[]>);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private addNewPage() {
    this.pdf.addPage();
    this.currentY = 20;
    // Add watermark to the new page immediately
    const currentPage = this.pdf.internal.getNumberOfPages();
    this.addWatermarkToPage(currentPage);
  }

  private addWatermarkToPage(pageNumber: number) {
    // Save current position
    const savedY = this.currentY;
    const currentPage = this.pdf.internal.getCurrentPageInfo().pageNumber;
    
    // Add text watermark
    this.pdf.setPage(pageNumber);
    this.pdf.setFontSize(72);
    this.pdf.setTextColor(245, 245, 245); // Very light gray
    
    // Calculate center position
    const text = 'SubAlerts';
    const textWidth = this.pdf.getTextWidth(text);
    const x = (this.pageWidth - textWidth) / 2;
    const y = this.pageHeight / 2;
    
    // Add watermark text
    this.pdf.text(text, x, y);
    
    // Reset to default text settings
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(this.textColor);
    
    // Restore page and position
    this.pdf.setPage(currentPage);
    this.currentY = savedY;
  }

  private addFooterToAllPages() {
    const pageCount = this.pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      // Add watermark to each page
      this.addWatermarkToPage(i);
      
      // Add page number
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(this.darkGray);
      const pageText = `Page ${i} of ${pageCount}`;
      const pageTextWidth = this.pdf.getTextWidth(pageText);
      this.pdf.text(
        pageText,
        (this.pageWidth - pageTextWidth) / 2,
        this.pageHeight - 10
      );
      
      // Add footer text
      this.pdf.text(
        'Generated by SubAlerts',
        this.margin,
        this.pageHeight - 10
      );
    }
  }

  // Additional helper methods for other report types
  private addDetailedSubscription(api: API, categories: Category[], includeNotes?: boolean) {
    const category = categories.find(c => c.id === api.category);
    
    // Service name
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text(api.serviceName, this.margin, this.currentY);
    
    // Category badge
    if (category) {
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(category.color);
      const categoryText = category.name;
      const categoryTextWidth = this.pdf.getTextWidth(categoryText);
      this.pdf.text(categoryText, this.pageWidth - this.margin - categoryTextWidth, this.currentY);
    }
    
    this.currentY += 8;
    
    // Details grid
    const details = [
      { label: 'Email', value: api.email },
      { label: 'Type', value: api.subscriptionType === 'paid' ? 'Paid' : 'Free' },
      { label: 'Cost', value: api.cost ? `$${api.cost}/${api.billingCycle}` : '-' },
      { label: 'Renewal', value: api.expiryDate ? format(new Date(api.expiryDate), 'MMMM dd, yyyy') : '-' },
      { label: 'Auto-renews', value: api.autoRenews ? 'Yes' : 'No' },
      { label: 'Website', value: api.website || '-' }
    ];
    
    this.pdf.setFontSize(9);
    details.forEach(detail => {
      this.pdf.setTextColor(this.darkGray);
      this.pdf.text(`${detail.label}:`, this.margin, this.currentY);
      this.pdf.setTextColor(this.textColor);
      this.pdf.text(detail.value, this.margin + 25, this.currentY);
      this.currentY += 5;
    });
    
    // Notes
    if (includeNotes && api.notes) {
      this.currentY += 3;
      this.pdf.setTextColor(this.darkGray);
      this.pdf.text('Notes:', this.margin, this.currentY);
      this.currentY += 5;
      this.pdf.setTextColor(this.textColor);
      const lines = this.pdf.splitTextToSize(api.notes, this.contentWidth - 10);
      lines.forEach((line: string) => {
        this.pdf.text(line, this.margin + 5, this.currentY);
        this.currentY += 4;
      });
    }
    
    this.currentY += 10;
    
    // Separator
    this.pdf.setDrawColor(this.lightGray);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addFinancialSummary(apis: API[], categories: Category[]) {
    const stats = this.calculateStatistics(apis);
    
    // Title
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text('Financial Overview', this.margin, this.currentY);
    this.currentY += 10;
    
    // Cost breakdown
    const paidApis = apis.filter(api => api.subscriptionType === 'paid');
    const monthlyApis = paidApis.filter(api => api.billingCycle === 'monthly');
    const yearlyApis = paidApis.filter(api => api.billingCycle === 'yearly');
    
    // Financial metrics
    this.pdf.setFontSize(11);
    this.pdf.text(`Total Monthly Cost: $${stats.monthlyCost.toFixed(2)}`, this.margin, this.currentY);
    this.currentY += 6;
    this.pdf.text(`Total Yearly Cost: $${stats.yearlyCost.toFixed(2)}`, this.margin, this.currentY);
    this.currentY += 6;
    this.pdf.text(`Average Cost per Subscription: $${(stats.monthlyCost / paidApis.length || 0).toFixed(2)}/month`, this.margin, this.currentY);
    this.currentY += 6;
    this.pdf.text(`Monthly Subscriptions: ${monthlyApis.length}`, this.margin, this.currentY);
    this.currentY += 6;
    this.pdf.text(`Yearly Subscriptions: ${yearlyApis.length}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  private addCostBreakdownByCategory(apis: API[], categories: Category[]) {
    const categoryData = this.groupApisByCategory(apis, categories);
    
    // Title
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text('Cost Breakdown by Category', this.margin, this.currentY);
    this.currentY += 10;
    
    // Calculate costs by category
    const categoryCosts = Object.entries(categoryData).map(([categoryId, categoryApis]) => {
      const category = categories.find(c => c.id === categoryId);
      const monthlyCost = categoryApis.reduce((total, api) => {
        if (api.subscriptionType === 'paid' && api.cost) {
          const monthly = api.billingCycle === 'yearly' ? api.cost / 12 : api.cost;
          return total + monthly;
        }
        return total;
      }, 0);
      
      return {
        category: category || { id: 'other', name: 'Other', color: '#6b7280', emoji: '📦' },
        apis: categoryApis,
        monthlyCost
      };
    }).sort((a, b) => b.monthlyCost - a.monthlyCost);
    
    // Add category cost table
    categoryCosts.forEach(({ category, apis, monthlyCost }) => {
      if (this.currentY > this.pageHeight - 40) {
        this.addNewPage();
      }
      
      // Category header
      this.pdf.setFontSize(11);
      this.pdf.setTextColor(category.color);
      this.pdf.text(category.name, this.margin, this.currentY);
      
      this.pdf.setTextColor(this.textColor);
      const costText = `$${monthlyCost.toFixed(2)}/month`;
      const costTextWidth = this.pdf.getTextWidth(costText);
      this.pdf.text(costText, this.pageWidth - this.margin - costTextWidth, this.currentY);
      
      this.currentY += 6;
      
      // Subscription details
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(this.darkGray);
      apis.forEach(api => {
        if (api.subscriptionType === 'paid' && api.cost) {
          const monthly = api.billingCycle === 'yearly' ? api.cost / 12 : api.cost;
          this.pdf.text(`  • ${api.serviceName}`, this.margin + 5, this.currentY);
          const monthlyText = `$${monthly.toFixed(2)}/mo`;
          const monthlyTextWidth = this.pdf.getTextWidth(monthlyText);
          this.pdf.text(monthlyText, this.pageWidth - this.margin - monthlyTextWidth, this.currentY);
          this.currentY += 5;
        }
      });
      
      this.currentY += 5;
    });
  }

  private async addMonthlyCostChart(apis: API[]) {
    // Implementation for monthly cost trend chart
    // This would require historical data or projections
    this.currentY += 80; // Placeholder
  }

  private async addYearlyCostProjection(apis: API[]) {
    // Implementation for yearly cost projection
    this.currentY += 80; // Placeholder
  }

  private addUpcomingRenewalsSummary(apis: API[]) {
    // Group by time periods
    const now = new Date();
    const next7Days = apis.filter(api => {
      if (!api.expiryDate) return false;
      const days = Math.ceil((new Date(api.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 7;
    });
    
    const next30Days = apis.filter(api => {
      if (!api.expiryDate) return false;
      const days = Math.ceil((new Date(api.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days > 7 && days <= 30;
    });
    
    const next90Days = apis.filter(api => {
      if (!api.expiryDate) return false;
      const days = Math.ceil((new Date(api.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days > 30 && days <= 90;
    });
    
    // Title
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text('Upcoming Renewals', this.margin, this.currentY);
    this.currentY += 10;
    
    // Summary boxes
    const summaryData = [
      { period: 'Next 7 Days', count: next7Days.length, color: '#dc2626' },
      { period: 'Next 30 Days', count: next30Days.length, color: '#ea580c' },
      { period: 'Next 90 Days', count: next90Days.length, color: '#2563eb' }
    ];
    
    summaryData.forEach((data, index) => {
      const x = this.margin + (index * 60);
      
      this.pdf.setFillColor(data.color);
      this.pdf.roundedRect(x, this.currentY, 55, 30, 3, 3, 'F');
      
      this.pdf.setTextColor('#ffffff');
      this.pdf.setFontSize(18);
      this.pdf.text(data.count.toString(), x + 27.5, this.currentY + 15, { align: 'center' });
      
      this.pdf.setFontSize(9);
      this.pdf.text(data.period, x + 27.5, this.currentY + 23, { align: 'center' });
    });
    
    this.currentY += 40;
  }

  private async addRenewalCalendar(apis: API[]) {
    // Implementation for visual renewal calendar
    this.currentY += 100; // Placeholder
  }

  private addRenewalList(apis: API[], categories: Category[]) {
    // Title
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text('Renewal Schedule', this.margin, this.currentY);
    this.currentY += 10;
    
    // Group by month
    const renewalsByMonth: Record<string, API[]> = {};
    
    apis.forEach(api => {
      if (api.expiryDate) {
        const monthKey = format(new Date(api.expiryDate), 'MMMM yyyy');
        if (!renewalsByMonth[monthKey]) {
          renewalsByMonth[monthKey] = [];
        }
        renewalsByMonth[monthKey].push(api);
      }
    });
    
    // Add renewals by month
    Object.entries(renewalsByMonth).forEach(([month, monthApis]) => {
      if (this.currentY > this.pageHeight - 50) {
        this.addNewPage();
      }
      
      // Month header
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(this.primaryColor);
      this.pdf.text(month, this.margin, this.currentY);
      this.currentY += 8;
      
      // Renewals for this month
      this.pdf.setFontSize(10);
      monthApis.forEach(api => {
        const category = categories.find(c => c.id === api.category);
        
        this.pdf.setTextColor(this.textColor);
        this.pdf.text(`${format(new Date(api.expiryDate!), 'dd')} - ${api.serviceName}`, this.margin + 5, this.currentY);
        
        if (api.subscriptionType === 'paid' && api.cost) {
          const apiCostText = `$${api.cost}`;
          const apiCostWidth = this.pdf.getTextWidth(apiCostText);
          this.pdf.text(apiCostText, this.pageWidth - this.margin - apiCostWidth, this.currentY);
        }
        
        if (category) {
          this.pdf.setTextColor(category.color);
          // Skip emoji in PDF
        }
        
        this.currentY += 6;
      });
      
      this.currentY += 5;
    });
  }

  private addCategorySummary(groupedApis: Record<string, API[]>, categories: Category[]) {
    // Title
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(this.textColor);
    this.pdf.text('Category Overview', this.margin, this.currentY);
    this.currentY += 10;
    
    // Category stats
    Object.entries(groupedApis).forEach(([categoryId, apis]) => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;
      
      const stats = this.calculateStatistics(apis);
      
      if (this.currentY > this.pageHeight - 40) {
        this.addNewPage();
      }
      
      // Category box
      // Use light version of the color since jsPDF doesn't support alpha
      const rgb = this.hexToRgb(category.color);
      if (rgb) {
        // Create a lighter version by mixing with white
        this.pdf.setFillColor(
          Math.min(255, rgb.r + (255 - rgb.r) * 0.8),
          Math.min(255, rgb.g + (255 - rgb.g) * 0.8),
          Math.min(255, rgb.b + (255 - rgb.b) * 0.8)
        );
      }
      this.pdf.roundedRect(this.margin, this.currentY, this.contentWidth, 35, 3, 3, 'F');
      
      // Category info
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(category.color);
      this.pdf.text(category.name, this.margin + 5, this.currentY + 10);
      
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(this.textColor);
      this.pdf.text(`${apis.length} subscriptions`, this.margin + 5, this.currentY + 20);
      this.pdf.text(`$${stats.monthlyCost.toFixed(2)}/month`, this.margin + 5, this.currentY + 28);
      
      this.currentY += 40;
    });
  }

  private addCategorySection(category: Category, apis: API[]) {
    if (this.currentY > this.pageHeight - 60) {
      this.addNewPage();
    }
    
    // Category header
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(category.color);
    this.pdf.text(category.name, this.margin, this.currentY);
    
    const stats = this.calculateStatistics(apis);
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(this.darkGray);
    const categoryStatsText = `${apis.length} subscriptions • $${stats.monthlyCost.toFixed(2)}/month`;
    const categoryStatsWidth = this.pdf.getTextWidth(categoryStatsText);
    this.pdf.text(categoryStatsText, this.pageWidth - this.margin - categoryStatsWidth, this.currentY);
    
    this.currentY += 10;
    
    // Subscription list
    this.pdf.setFontSize(9);
    apis.forEach(api => {
      if (this.currentY > this.pageHeight - 20) {
        this.addNewPage();
      }
      
      this.pdf.setTextColor(this.textColor);
      this.pdf.text(`• ${api.serviceName}`, this.margin + 5, this.currentY);
      
      if (api.subscriptionType === 'paid' && api.cost) {
        const monthly = api.billingCycle === 'yearly' ? api.cost / 12 : api.cost;
        const costText = `$${monthly.toFixed(2)}/mo`;
        const costTextWidth = this.pdf.getTextWidth(costText);
        this.pdf.text(costText, this.pageWidth - this.margin - costTextWidth, this.currentY);
      }
      
      this.currentY += 5;
    });
    
    this.currentY += 10;
  }
}