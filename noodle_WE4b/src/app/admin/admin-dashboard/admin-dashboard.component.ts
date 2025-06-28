import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { NavbarService } from '../../services/navbar.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Subscription, interval } from 'rxjs';

// IMPORTS CHART.JS
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  registerables
} from 'chart.js';

// Enregistrer tous les composants de Chart.js
Chart.register(...registerables);

export interface DashboardData {
  overview: {
    totalUsers: number;
    totalUes: number;
    totalForums: number;
    totalPosts: number;
    activeUsers: number;
    newUsersThisMonth: number;
    usersByRole?: any;
  };
  analytics: {
    usersByRole: any[];
    uesByDepartment: any[];
    activityTrends: any[];
    forumActivity: any[];
    postActivity?: any[];
    userEngagement?: any[];
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
  performance?: {
    avgResponseTime: number;
    successRate: number;
    maxThroughput: number;
    bottlenecks: any[];
  };
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heatmapChart') heatmapChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('connectionChart') connectionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('responseTimeChart') responseTimeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('errorRateChart') errorRateChartRef!: ElementRef<HTMLCanvasElement>;

  // DONNÉES PRINCIPALES
  dashboardData: DashboardData | null = null;
  isLoading = true;
  error: string | null = null;

  // CONFIGURATION
  selectedTimeRange = '7days';
  selectedMetric = 'users';
  selectedOlapDimension = 'time_role_activity';
  autoRefresh = true;

  // SUBSCRIPTIONS
  private subscriptions: Subscription[] = [];

  // STOCKAGE DES INSTANCES CHART
  private charts: { [key: string]: Chart } = {};
  private realtimeIntervalSub?: Subscription;
  private metricsIntervalSub?: Subscription;

  // ÉTATS INTERFACE
  activeTab = 'overview';
  showFilters = true;
  showExportModal = false;

  // DONNÉES TEMPS RÉEL
  realtimeMetrics = {
    connectionsPerSecond: 0,
    averageResponseTime: 0,
    errorRate: 0,
    throughput: 0
  };

  // EXPORT
  exportConfig = {
    includeCharts: true,
    includeRawData: false,
    includeOlap: true
  };

  // DATE ACTUELLE
  currentDate = new Date();

  constructor(
    private dashboardService: AdminDashboardService,
    private navbarService: NavbarService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initializeNavbar();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Attendre que le DOM soit complètement chargé
    setTimeout(() => {
      this.initializeCharts();
    }, 1000);
  }

  ngOnDestroy(): void {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.clearRealtimeIntervals();
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
        this.isLoading = false;
        // Attendre que la vue soit prête avant d'initialiser les graphiques
        setTimeout(() => {
          this.initializeCharts();
          if (this.autoRefresh) {
            this.setupRealTimeUpdates();
          }
        }, 100);
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des données du dashboard';
        this.isLoading = false;
        console.error('Erreur dashboard:', err);
      }
    });

    this.subscriptions.push(loadSub);
  }

  private setupRealTimeUpdates(): void {
    this.clearRealtimeIntervals();
    if (this.autoRefresh) {
      this.realtimeIntervalSub = interval(30000).subscribe(() => {
        this.refreshRealTimeData();
      });
      this.metricsIntervalSub = interval(5000).subscribe(() => {
        this.updateRealTimeMetrics();
      });
    }
  }

  private clearRealtimeIntervals(): void {
    if (this.realtimeIntervalSub) {
      this.realtimeIntervalSub.unsubscribe();
      this.realtimeIntervalSub = undefined;
    }
    if (this.metricsIntervalSub) {
      this.metricsIntervalSub.unsubscribe();
      this.metricsIntervalSub = undefined;
    }
  }

  private refreshRealTimeData(): void {
    if (!this.dashboardData) return;

    const realtimeSub = this.dashboardService.getRealTimeData().subscribe({
      next: (data) => {
        if (this.dashboardData) {
          this.dashboardData.realtime = data;
        }
      },
      error: (err) => {}
    });
    this.subscriptions.push(realtimeSub);
  }

  private updateRealTimeMetrics(): void {
    const metricsSub = this.dashboardService.getSystemMetrics().subscribe({
      next: (metrics) => {
        this.realtimeMetrics = {
          connectionsPerSecond: metrics.connectionsPerSecond || 0,
          averageResponseTime: metrics.avgResponseTime || 0,
          errorRate: metrics.errorRate || 0,
          throughput: metrics.requestsPerHour || 0
        };
      },
      error: (err) => {}
    });
    this.subscriptions.push(metricsSub);
  }

  private initializeCharts(): void {
    if (this.dashboardData) {
      switch (this.activeTab) {
        case 'overview':
          this.createPieChart();
          this.createLineChart();
          break;
        case 'analytics':
          this.createTrendChart();
          break;
        case 'olap':
          this.createHeatmapChart();
          break;
        case 'realtime':
          this.createConnectionChart();
          break;
        case 'performance':
          this.createResponseTimeChart();
          this.createErrorRateChart();
          break;
      }
    }
  }

  private createPieChart(): void {
    if (!this.pieChartRef?.nativeElement || !this.dashboardData?.analytics?.usersByRole) {
      return;
    }

    const ctx = this.pieChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.dashboardData.analytics.usersByRole;
    const chartData = {
      labels: data.map((item: any) => this.formatRoleName(item._id)),
      datasets: [{
        data: data.map((item: any) => item.count || 0),
        backgroundColor: ['#f47d42', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20
            }
          },
          title: {
            display: true,
            text: 'Répartition des utilisateurs'
          }
        }
      }
    };

    if (this.charts['pie']) {
      this.charts['pie'].destroy();
    }
    this.charts['pie'] = new Chart(ctx, config);
  }

  private createLineChart(): void {
    if (!this.lineChartRef?.nativeElement || !this.dashboardData?.analytics?.activityTrends) {
      return;
    }

    const ctx = this.lineChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.dashboardData.analytics.activityTrends;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map((item: any) => this.formatDateSimple(item.date)),
        datasets: [{
          label: 'Actions Totales',
          data: data.map((item: any) => item.totalActions || 0),
          borderColor: '#f47d42',
          backgroundColor: 'rgba(244, 125, 66, 0.1)',
          fill: true,
          tension: 0.4
        }, {
          label: 'Utilisateurs Uniques',
          data: data.map((item: any) => item.uniqueUsers || 0),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Évolution de l\'activité',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { color: '#f1f5f9' }
          }
        }
      }
    };

    if (this.charts['line']) {
      this.charts['line'].destroy();
    }

    this.charts['line'] = new Chart(ctx, config);
  }

  private createTrendChart(): void {
    if (!this.trendChartRef || !this.trendChartRef.nativeElement || !this.dashboardData?.analytics?.activityTrends) {
      return;
    }
    const canvas = this.trendChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.charts['trend']) {
      this.charts['trend'].destroy();
    }

    const data = this.dashboardData.analytics.activityTrends;

    this.charts['trend'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((item: any) => this.formatDateSimple(item.date)),
        datasets: [{
          label: 'Taux de Succès (%)',
          data: data.map((item: any) => item.successRate || 0),
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Analyse des Tendances' }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }

  private createHeatmapChart(): void {
    if (!this.heatmapChartRef || !this.heatmapChartRef.nativeElement || !this.dashboardData?.olap?.userActivityCube) {
      return;
    }
    const canvas = this.heatmapChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.charts['heatmap']) {
      this.charts['heatmap'].destroy();
    }

    const activityData = this.dashboardData.olap.userActivityCube;
    const processedData = this.processHeatmapData(activityData);

    this.charts['heatmap'] = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Activité par heure et rôle',
          data: processedData,
          backgroundColor: (context: any) => {
            const value = context.raw.v || 0;
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
          legend: { display: false },
          title: { display: true, text: 'Heatmap d\'activité (Heure × Rôle)' }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: { display: true, text: 'Heure' },
            min: 0,
            max: 23
          },
          y: {
            type: 'linear',
            title: { display: true, text: 'Rôle' }
          }
        }
      }
    });
  }

  private createConnectionChart(): void {
    if (!this.connectionChartRef?.nativeElement) {
      return;
    }

    const ctx = this.connectionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.charts['connection']) {
      this.charts['connection'].destroy();
    }

    // Données simulées pour les connexions
    const connectionData = Array.from({ length: 10 }, (_, i) => ({
      time: new Date(Date.now() - (9 - i) * 5000).toLocaleTimeString(),
      connections: Math.floor(Math.random() * 20) + 5
    }));

    this.charts['connection'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: connectionData.map(d => d.time),
        datasets: [{
          label: 'Connexions/sec',
          data: connectionData.map(d => d.connections),
          borderColor: '#f47d42',
          backgroundColor: 'rgba(244, 125, 66, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  private createResponseTimeChart(): void {
    if (!this.responseTimeChartRef || !this.responseTimeChartRef.nativeElement) {
      return;
    }
    const canvas = this.responseTimeChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.charts['responseTime']) {
      this.charts['responseTime'].destroy();
    }

    // Données simulées
    const responseData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      avgTime: Math.floor(Math.random() * 500) + 100
    }));

    this.charts['responseTime'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: responseData.map(d => `${d.hour}h`),
        datasets: [{
          label: 'Temps de réponse (ms)',
          data: responseData.map(d => d.avgTime),
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  private createErrorRateChart(): void {
    if (!this.errorRateChartRef || !this.errorRateChartRef.nativeElement) {
      return;
    }
    const canvas = this.errorRateChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.charts['errorRate']) {
      this.charts['errorRate'].destroy();
    }

    // Données simulées
    const errorData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      errorRate: Math.random() * 5
    }));

    this.charts['errorRate'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: errorData.map(d => `${d.hour}h`),
        datasets: [{
          label: 'Taux d\'erreur (%)',
          data: errorData.map(d => d.errorRate),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, max: 10 }
        }
      }
    });
  }

  formatDateSimple(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  updateAnalytics(): void {
    const analyticsSub = this.dashboardService.getAnalytics({
      metric: this.selectedMetric,
      timeRange: this.selectedTimeRange
    }).subscribe({
      next: (data) => {
        if (this.dashboardData) {
          this.dashboardData.analytics = data;
          this.initializeCharts();
        }
      },
      error: (err) => console.error('Erreur mise à jour analytics:', err)
    });
    this.subscriptions.push(analyticsSub);
  }

  updateOlapAnalysis(): void {
    const olapSub = this.dashboardService.getDetailedOlapAnalysis({
      dimensions: [this.selectedOlapDimension],
      timeRange: this.selectedTimeRange
    }).subscribe({
      next: (data) => {
        if (this.dashboardData) {
          this.dashboardData.olap = data;
          this.initializeCharts();
        }
      },
      error: (err) => console.error('Erreur mise à jour OLAP:', err)
    });
    this.subscriptions.push(olapSub);
  }

  getUserDisplayName(user: any): string {
    if (!user) return 'Système';
    if (user.prenom && user.nom) return `${user.prenom} ${user.nom}`;
    if (user.nom) return user.nom;
    return user.email || 'Utilisateur';
  }

  formatTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatTimePoint(point: any): string {
    if (!point) return '';
    if (typeof point === 'string') return point;

    let parts = [];
    if (point.year) parts.push(point.year);
    if (point.month) parts.push(point.month.toString().padStart(2, '0'));
    if (point.day) parts.push(point.day.toString().padStart(2, '0'));
    if (point.hour !== undefined) parts.push(`${point.hour}h`);

    if (parts.length === 0) return JSON.stringify(point);
    return parts.join('-');
  }

  private processHeatmapData(data: any[]): any[] {
    if (!data) return [];

    const roleMap: { [key: string]: number } = {
      'ROLE_USER': 0,
      'ROLE_PROF': 1,
      'ROLE_ADMIN': 2
    };

    return data.map(item => ({
      x: item.hour || 0,
      y: roleMap[item.role] || 0,
      v: item.activityCount || 0
    }));
  }

  // MÉTHODES D'INTERACTION UTILISATEUR

  onTimeRangeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    console.log('📅 Changement période:', target.value);
    this.selectedTimeRange = target.value;
    this.loadDashboardData();
  }

  onMetricChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    console.log('📊 Changement métrique:', target.value);
    this.selectedMetric = target.value;
    this.updateAnalytics();
  }

  onOlapDimensionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    console.log('🧊 Changement dimension OLAP:', target.value);
    this.selectedOlapDimension = target.value;
    this.updateOlapAnalysis();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    // Détruire les graphiques existants
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};

    // Attendre que le DOM soit mis à jour
    setTimeout(() => {
      this.initializeCharts();
    }, 200);
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    this.clearRealtimeIntervals();
    if (this.autoRefresh) {
      this.setupRealTimeUpdates();
    }
  }


  refresh(): void {
    this.loadDashboardData();
  }

  exportData(format: 'csv' | 'excel' | 'pdf'): void {
    this.showExportModal = true;
    // La logique d'export réel sera dans confirmExport()
  }

  confirmExport(): void {
    // À adapter selon votre logique d'export
    this.showExportModal = false;
  }

  cancelExport(): void {
    this.showExportModal = false;
  }

  getTabLabel(tab: string): string {
    const labels: any = {
      overview: 'Vue d\'ensemble',
      analytics: 'Analyses',
      olap: 'OLAP',
      realtime: 'Temps réel',
      performance: 'Performance'
    };
    return labels[tab] || tab;
  }

  formatRoleName(role: string): string {
    const roleMap: any = {
      'ROLE_ADMIN': 'Administrateur',
      'ROLE_PROF': 'Professeur',
      'ROLE_USER': 'Étudiant'
    };
    return roleMap[role] || role;
  }

  formatNumber(val: number): string {
    return val.toLocaleString('fr-FR');
  }

  getGrowthIcon(current: number, previous: number): string {
    if (current > previous) return '⬆️';
    if (current < previous) return '⬇️';
    return '➡️';
  }

  isRecentActivity(timestamp: string): boolean {
    const now = Date.now();
    const date = new Date(timestamp).getTime();
    return now - date < 1000 * 60 * 60; // moins d'1h
  }

  getActivityIcon(category: string): string {
    const map: any = {
      'user': '👤',
      'forum': '💬',
      'post': '📝',
      'ue': '📚',
      'system': '🖥️'
    };
    return map[category] || '🔔';
  }

  formatActivityAction(action: string): string {
    if (!action) return '';
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Méthodes manquantes
  formatRelativeTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'il y a quelques secondes';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString('fr-FR');
  }

  getUserAvatar(user: any): string {
    if (!user?.photo) {
      return 'assets/images/default-avatar.png';
    }
    return `/uploads/photos/${user.photo}`;
  }

  getSeverityClass(severity: string): string {
    if (!severity) return '';
    const severityMap: { [key: string]: string } = {
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    return severityMap[severity.toLowerCase()] || '';
  }

  getHealthStatus(): string {
    if (!this.realtimeMetrics) return 'healthy';
    if (this.realtimeMetrics.errorRate > 5) return 'error';
    if (this.realtimeMetrics.errorRate > 2) return 'warning';
    return 'healthy';
  }

  getHealthStatusText(): string {
    const status = this.getHealthStatus();
    const statusMap: { [key: string]: string } = {
      healthy: 'Système sain',
      warning: 'Attention',
      error: 'Problème détecté'
    };
    return statusMap[status] || 'Statut inconnu';
  }
}
