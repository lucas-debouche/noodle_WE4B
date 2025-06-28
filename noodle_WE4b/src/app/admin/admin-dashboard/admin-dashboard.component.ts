// admin-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { NavbarService } from '../../services/navbar.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Subscription, interval } from 'rxjs';

export interface DashboardData {
  overview: {
    totalUsers: number;
    totalUes: number;
    totalForums: number;
    totalPosts: number;
    activeUsers: number;
    newUsersThisMonth: number;
  };
  analytics: {
    usersByRole: any[];
    uesByDepartment: any[];
    activityTrends: any[];
    forumActivity: any[];
    postActivity: any[];
    userEngagement: any[];
  };
  olap: {
    userActivityCube: any[];
    ueParticipationMatrix: any[];
    timeSeriesAnalysis: any[];
    geographicalDistribution: any[];
  };
  realtime: {
    activeUsersNow: number;
    currentSessions: any[];
    recentActivities: any[];
    systemHealth: any;
  };
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  dashboardData: DashboardData | null = null;
  isLoading = true;
  error: string | null = null;

  // Configuration des graphiques
  selectedTimeRange = '7days';
  selectedMetric = 'users';
  selectedOlapDimension = 'time_role_activity';
  autoRefresh = true;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Données pour les graphiques
  chartOptions: any = {};
  lineChartData: any[] = [];
  pieChartData: any[] = [];
  heatmapData: any[] = [];

  // États pour les filtres et vues
  activeTab = 'overview';
  showFilters = true;
  compactView = false;

  // Données temps réel
  realtimeMetrics = {
    connectionsPerSecond: 0,
    averageResponseTime: 0,
    errorRate: 0,
    throughput: 0
  };

  constructor(
    private dashboardService: AdminDashboardService,
    private navbarService: NavbarService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initializeNavbar();
    this.loadDashboardData();
    this.setupRealTimeUpdates();
    this.initializeChartOptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeNavbar(): void {
    this.userService.getUtilisateurActuel().subscribe({
      next: (user: User) => {
        this.navbarService.setTitle('Dashboard Administrateur');
        this.navbarService.setCurrentUser(user);
      },
      error: (err) => console.error('Erreur lors de la récupération de l\'utilisateur:', err)
    });
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    const loadSub = this.dashboardService.getDashboardData({
      timeRange: this.selectedTimeRange,
      includeOlap: true,
      includeRealtime: true
    }).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.updateChartData();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des données du dashboard';
        this.isLoading = false;
        console.error('Dashboard error:', err);
      }
    });

    this.subscriptions.push(loadSub);
  }

  private setupRealTimeUpdates(): void {
    if (this.autoRefresh) {
      const realtimeSub = interval(30000).subscribe(() => {
        this.refreshRealTimeData();
      });
      this.subscriptions.push(realtimeSub);

      const metricsSub = interval(5000).subscribe(() => {
        this.updateRealTimeMetrics();
      });
      this.subscriptions.push(metricsSub);
    }
  }

  private refreshRealTimeData(): void {
    const realtimeSub = this.dashboardService.getRealTimeData().subscribe({
      next: (data) => {
        if (this.dashboardData) {
          this.dashboardData.realtime = data;
        }
      },
      error: (err) => console.error('Erreur temps réel:', err)
    });
    this.subscriptions.push(realtimeSub);
  }

  private updateRealTimeMetrics(): void {
    const metricsSub = this.dashboardService.getSystemMetrics().subscribe({
      next: (metrics) => {
        this.realtimeMetrics = metrics;
      },
      error: (err) => console.error('Erreur métriques système:', err)
    });
    this.subscriptions.push(metricsSub);
  }

  private initializeChartOptions(): void {
    this.chartOptions = {
      line: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Tendances d\'activité' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      },
      pie: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
          title: { display: true, text: 'Répartition' }
        }
      },
      heatmap: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Analyse OLAP - Matrice d\'activité' }
        }
      }
    };
  }

  private updateChartData(): void {
    if (!this.dashboardData) return;

    // Données pour graphique linéaire (tendances)
    this.lineChartData = this.dashboardService.formatTimeSeriesData(
      this.dashboardData.analytics.activityTrends
    );

    // Données pour graphique circulaire (répartition)
    this.pieChartData = this.dashboardService.formatPieChartData(
      this.dashboardData.analytics.usersByRole
    );

    // Données pour heatmap OLAP
    this.heatmapData = this.dashboardService.formatHeatmapData(
      this.dashboardData.olap.userActivityCube
    );
  }

  // Méthodes d'interaction utilisateur
  onTimeRangeChange(range: string): void {
    this.selectedTimeRange = range;
    this.loadDashboardData();
  }

  onMetricChange(metric: string): void {
    this.selectedMetric = metric;
    this.updateAnalytics();
  }

  onOlapDimensionChange(dimension: string): void {
    this.selectedOlapDimension = dimension;
    this.updateOlapAnalysis();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'olap') {
      this.loadOlapData();
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.setupRealTimeUpdates();
    } else {
      // Annuler les subscriptions de temps réel
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions = [];
    }
  }

  toggleCompactView(): void {
    this.compactView = !this.compactView;
  }

  exportData(format: 'csv' | 'excel' | 'pdf'): void {
    this.dashboardService.exportDashboardData(format, {
      timeRange: this.selectedTimeRange,
      includedSections: [this.activeTab]
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-data.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Erreur export:', err)
    });
  }

  private updateAnalytics(): void {
    const analyticsSub = this.dashboardService.getAnalytics({
      metric: this.selectedMetric,
      timeRange: this.selectedTimeRange
    }).subscribe({
      next: (analytics) => {
        if (this.dashboardData) {
          this.dashboardData.analytics = analytics;
          this.updateChartData();
        }
      },
      error: (err) => console.error('Erreur analytics:', err)
    });
    this.subscriptions.push(analyticsSub);
  }

  private updateOlapAnalysis(): void {
    const olapSub = this.dashboardService.getOlapAnalysis({
      dimension: this.selectedOlapDimension,
      timeRange: this.selectedTimeRange
    }).subscribe({
      next: (olap) => {
        if (this.dashboardData) {
          this.dashboardData.olap = olap;
          this.updateChartData();
        }
      },
      error: (err) => console.error('Erreur OLAP:', err)
    });
    this.subscriptions.push(olapSub);
  }

  private loadOlapData(): void {
    if (!this.dashboardData?.olap || Object.keys(this.dashboardData.olap).length === 0) {
      const olapSub = this.dashboardService.getDetailedOlapAnalysis({
        dimensions: ['time', 'role', 'activity', 'department'],
        measures: ['userCount', 'activityCount', 'sessionDuration'],
        timeRange: this.selectedTimeRange
      }).subscribe({
        next: (olap) => {
          if (this.dashboardData) {
            this.dashboardData.olap = olap;
            this.updateChartData();
          }
        },
        error: (err) => console.error('Erreur OLAP détaillé:', err)
      });
      this.subscriptions.push(olapSub);
    }
  }

  // Méthodes utilitaires pour l'affichage
  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatPercentage(value: number, total: number): string {
    return total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
  }

  getGrowthIcon(current: number, previous: number): string {
    if (current > previous) return '📈';
    if (current < previous) return '📉';
    return '➡️';
  }

  getGrowthClass(current: number, previous: number): string {
    if (current > previous) return 'growth-positive';
    if (current < previous) return 'growth-negative';
    return 'growth-neutral';
  }

  refresh(): void {
    this.loadDashboardData();
  }
  getTabLabel(tab: string): string {
    const labels: { [key: string]: string } = {
      'overview': '📊 Vue d\'ensemble',
      'analytics': '📈 Analytics',
      'olap': '🧊 OLAP',
      'realtime': '⚡ Temps Réel',
      'performance': '🚀 Performance'
    };
    return labels[tab] || tab;
  }

  getActivityIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'auth': '🔐',
      'user': '👤',
      'ue': '📚',
      'forum': '💬',
      'post': '📝',
      'admin': '⚙️',
      'system': '🖥️',
      'error': '❌',
      'warning': '⚠️',
      'success': '✅'
    };
    return icons[category] || '📄';
  }

  formatActivityAction(action: string): string {
    const actionMap: { [key: string]: string } = {
      'login': 'Connexion',
      'logout': 'Déconnexion',
      'create_user': 'Création utilisateur',
      'update_user': 'Modification utilisateur',
      'delete_user': 'Suppression utilisateur',
      'create_ue': 'Création UE',
      'update_ue': 'Modification UE',
      'delete_ue': 'Suppression UE',
      'create_forum': 'Création forum',
      'add_message_forum': 'Message forum',
      'add_reply_forum': 'Réponse forum',
      'create_post': 'Création publication',
      'get_all_users': 'Consultation utilisateurs',
      'get_all_ues': 'Consultation UEs',
      'dashboard_overview_accessed': 'Accès dashboard'
    };
    return actionMap[action] || action.replace(/_/g, ' ');
  }

  formatRelativeTime(timestamp: string | Date): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return time.toLocaleDateString('fr-FR');
  }

  formatTime(timestamp: string | Date): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatRoleName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ROLE_ADMIN': 'Admin',
      'ROLE_PROF': 'Prof',
      'ROLE_USER': 'Étudiant'
    };
    return roleMap[role] || role;
  }

  formatTimePoint(timePoint: any): string {
    if (timePoint.year && timePoint.month && timePoint.day && timePoint.hour) {
      return `${timePoint.day}/${timePoint.month} ${timePoint.hour}h`;
    }
    if (timePoint.year && timePoint.month && timePoint.day) {
      return `${timePoint.day}/${timePoint.month}/${timePoint.year}`;
    }
    if (timePoint.year && timePoint.month) {
      return `${timePoint.month}/${timePoint.year}`;
    }
    return JSON.stringify(timePoint);
  }

  getUserAvatar(user: any): string {
    if (user?.photo) {
      return user.photo.startsWith('http') ? user.photo : `http://localhost:3000/uploads/user/${user.photo}`;
    }
    return '/assets/default-avatar.png';
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity.toLowerCase()}`;
  }

  getHealthStatus(): string {
    if (!this.dashboardData?.realtime?.systemHealth) return 'unknown';

    const health = this.dashboardData.realtime.systemHealth;
    const errorRate = health.errorRate || 0;
    const avgResponseTime = health.avgResponseTime || 0;

    if (errorRate > 5 || avgResponseTime > 2000) return 'error';
    if (errorRate > 2 || avgResponseTime > 1000) return 'warning';
    return 'healthy';
  }

  getHealthStatusText(): string {
    const status = this.getHealthStatus();
    const statusMap: { [key: string]: string } = {
      'healthy': '🟢 Système opérationnel',
      'warning': '🟡 Attention requise',
      'error': '🔴 Problème détecté',
      'unknown': '⚫ Statut inconnu'
    };
    return statusMap[status] || 'Statut inconnu';
  }

// ===============================
// MÉTHODES DE GESTION DES DONNÉES
// ===============================

  private processChartData(): void {
    if (!this.dashboardData) return;

    // Traitement des données pour Chart.js
    this.initializeCharts();
  }

  private initializeCharts(): void {
    // Configuration et initialisation des graphiques
    setTimeout(() => {
      this.createLineChart();
      this.createPieChart();
      this.createHeatmapChart();
      this.createTrendChart();
      this.createConnectionChart();
      this.createResponseTimeChart();
      this.createErrorRateChart();
    }, 100);
  }

  private createLineChart(): void {
    const canvas = document.querySelector('#lineChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboardData?.analytics?.activityTrends) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if exists
    if ((canvas as any).chart) {
      (canvas as any).chart.destroy();
    }

    const data = this.dashboardData.analytics.activityTrends;

    (canvas as any).chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((item: any) => this.formatDate(item.date)),
        datasets: [{
          label: 'Actions Totales',
          data: data.map((item: any) => item.totalActions || 0),
          borderColor: '#f47d42',
          backgroundColor: 'rgba(244, 125, 66, 0.1)',
          tension: 0.4,
          fill: true
        }, {
          label: 'Utilisateurs Uniques',
          data: data.map((item: any) => item.uniqueUsers || 0),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const
          },
          title: {
            display: true,
            text: 'Évolution de l\'activité'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index' as const
        }
      }
    });
  }

  private createPieChart(): void {
    const canvas = document.querySelector('#pieChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboardData?.analytics?.usersByRole) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if ((canvas as any).chart) {
      (canvas as any).chart.destroy();
    }

    const data = this.dashboardData.analytics.usersByRole;

    (canvas as any).chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map((item: any) => this.formatRoleName(item._id)),
        datasets: [{
          data: data.map((item: any) => item.count || 0),
          backgroundColor: [
            '#f47d42',
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right' as const
          },
          title: {
            display: true,
            text: 'Répartition des utilisateurs'
          }
        }
      }
    });
  }

  private createHeatmapChart(): void {
    const canvas = document.querySelector('#heatmapChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboardData?.olap?.userActivityCube) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if ((canvas as any).chart) {
      (canvas as any).chart.destroy();
    }

    // Traitement des données pour créer une heatmap
    const activityData = this.dashboardData.olap.userActivityCube;
    const processedData = this.processHeatmapData(activityData);

    (canvas as any).chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Activité par heure et rôle',
          data: processedData,
          backgroundColor: (context: any) => {
            const value = context.parsed.v || 0;
            const intensity = Math.min(value / 10, 1);
            return `rgba(244, 125, 66, ${intensity})`;
          },
          pointRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Heatmap d\'activité (Heure × Rôle)'
          },
          tooltip: {
            callbacks: {
              title: () => '',
              label: (context: any) => {
                const data = context.raw;
                return `Heure ${data.x}, ${this.formatRoleName(data.role)}: ${data.v} actions`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear' as const,
            position: 'bottom' as const,
            title: {
              display: true,
              text: 'Heure'
            },
            min: 0,
            max: 23
          },
          y: {
            type: 'linear' as const,
            title: {
              display: true,
              text: 'Rôle'
            }
          }
        }
      }
    });
  }

  private processHeatmapData(data: any[]): any[] {
    const roleMap: { [key: string]: number } = {
      'ROLE_USER': 0,
      'ROLE_PROF': 1,
      'ROLE_ADMIN': 2
    };

    return data.map(item => ({
      x: item.hour || 0,
      y: roleMap[item.role] || 0,
      v: item.activityCount || 0,
      role: item.role
    }));
  }

  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric'
    });
  }

// ===============================
// MÉTHODES D'EXPORT
// ===============================

  showExportModal = false;
  exportConfig = {
    includeCharts: true,
    includeRawData: false,
    includeOlap: true
  };

  confirmExport(): void {
    this.showExportModal = false;
    // Logique d'export avec la configuration
    console.log('Export avec config:', this.exportConfig);
  }

  cancelExport(): void {
    this.showExportModal = false;
  }

// ===============================
// MÉTHODES UTILITAIRES
// ===============================

  downloadChart(chartId: string): void {
    const canvas = document.querySelector(`#${chartId}`) as HTMLCanvasElement;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Afficher une notification de succès
      console.log('Copié dans le presse-papiers');
    });
  }

// ===============================
// MÉTHODES DE NAVIGATION
// ===============================

  drillDownTimeLevel(level: string): void {
    // Logique de drill-down temporel
    console.log('Drill down vers:', level);
    // Actualiser les données avec le nouveau niveau
  }

  drillDownOlap(dimension: string, value: any): void {
    // Logique de drill-down OLAP
    console.log('Drill down OLAP:', dimension, value);
    // Actualiser l'analyse avec les nouveaux filtres
  }

// ===============================
// MÉTHODES DE CACHE ET OPTIMISATION
// ===============================

  private cacheKey = '';
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private shouldRefreshCache(): boolean {
    return Date.now() - this.cacheTimestamp > this.CACHE_DURATION;
  }

  private updateCache(data: any): void {
    this.cacheTimestamp = Date.now();
    // Logique de mise en cache
  }

// ===============================
// MÉTHODES DE VALIDATION
// ===============================

  private validateDashboardData(data: any): boolean {
    if (!data) return false;
    if (!data.overview) return false;
    if (!data.analytics) return false;

    return true;
  }

  private sanitizeFilters(filters: any): any {
    // Nettoyer et valider les filtres
    return {
      timeRange: filters.timeRange || '7days',
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
      departments: Array.isArray(filters.departments) ? filters.departments : [],
      roles: Array.isArray(filters.roles) ? filters.roles : []
    };
  }
}
