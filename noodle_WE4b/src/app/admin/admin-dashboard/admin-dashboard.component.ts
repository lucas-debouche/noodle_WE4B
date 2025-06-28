import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { NavbarService } from '../../services/navbar.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Subscription, interval } from 'rxjs';

// IMPORTS CHART.JS
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';

// ENREGISTREMENT DES COMPOSANTS CHART.JS
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

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

  // RÉFÉRENCES AUX CANVAS
  @ViewChild('pieChart', { static: false }) pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart', { static: false }) lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heatmapChart', { static: false }) heatmapChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart', { static: false }) trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('connectionChart', { static: false }) connectionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('responseTimeChart', { static: false }) responseTimeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('errorRateChart', { static: false }) errorRateChartRef!: ElementRef<HTMLCanvasElement>;

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

  // ÉTATS INTERFACE
  activeTab = 'overview';
  showFilters = true;
  compactView = false;

  // DONNÉES TEMPS RÉEL
  realtimeMetrics = {
    connectionsPerSecond: 0,
    averageResponseTime: 0,
    errorRate: 0,
    throughput: 0
  };

  // EXPORT
  showExportModal = false;
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
    this.setupRealTimeUpdates();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 500);
  }

  ngOnDestroy(): void {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
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
        console.log('✅ Données dashboard reçues:', data);
        this.dashboardData = data;
        this.isLoading = false;

        setTimeout(() => {
          this.updateCharts();
        }, 100);
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
    if (!this.dashboardData) return;

    const realtimeSub = this.dashboardService.getRealTimeData().subscribe({
      next: (data) => {
        if (this.dashboardData) {
          this.dashboardData.realtime = data;
          console.log('🔄 Données temps réel mises à jour:', data);
        }
      },
      error: (err) => console.error('Erreur temps réel:', err)
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
      error: (err) => console.error('Erreur métriques système:', err)
    });
    this.subscriptions.push(metricsSub);
  }

  private initializeCharts(): void {
    if (this.activeTab === 'overview') {
      this.createPieChart();
      this.createLineChart();
    }
  }

  private updateCharts(): void {
    setTimeout(() => {
      if (this.activeTab === 'overview') {
        this.createPieChart();
        this.createLineChart();
      } else if (this.activeTab === 'analytics') {
        this.createTrendChart();
      } else if (this.activeTab === 'olap') {
        this.createHeatmapChart();
      } else if (this.activeTab === 'realtime') {
        this.createConnectionChart();
      } else if (this.activeTab === 'performance') {
        this.createResponseTimeChart();
        this.createErrorRateChart();
      }
    }, 200);
  }

  private createPieChart(): void {
    if (!this.pieChartRef?.nativeElement || !this.dashboardData?.analytics?.usersByRole) {
      console.log('❌ Pie chart: Canvas ou données manquants');
      return;
    }

    const canvas = this.pieChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.charts['pie']) {
      this.charts['pie'].destroy();
    }

    const data = this.dashboardData.analytics.usersByRole;
    console.log('📊 Création pie chart avec données:', data);

    this.charts['pie'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map((item: any) => this.formatRoleName(item._id)),
        datasets: [{
          data: data.map((item: any) => item.count || 0),
          backgroundColor: ['#f47d42', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Répartition des utilisateurs',
            font: { size: 16, weight: 'bold' }
          }
        }
      }
    });
  }

  private createLineChart(): void {
    if (!this.lineChartRef?.nativeElement || !this.dashboardData?.analytics?.activityTrends) {
      console.log('❌ Line chart: Canvas ou données manquants');
      return;
    }

    const canvas = this.lineChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.charts['line']) {
      this.charts['line'].destroy();
    }

    const data = this.dashboardData.analytics.activityTrends;
    console.log('📈 Création line chart avec données:', data);

    this.charts['line'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((item: any) => this.formatDateSimple(item.date)),
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
    });
  }

  private createTrendChart(): void {
    if (!this.trendChartRef?.nativeElement || !this.dashboardData?.analytics?.activityTrends) {
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
    if (!this.heatmapChartRef?.nativeElement || !this.dashboardData?.olap?.userActivityCube) {
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

    const canvas = this.connectionChartRef.nativeElement;
    const ctx = canvas.getContext('2d');
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
    if (!this.responseTimeChartRef?.nativeElement) {
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
    if (!this.errorRateChartRef?.nativeElement) {
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
    console.log('🔄 Changement onglet:', tab);
    this.activeTab = tab;

    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};

    setTimeout(() => {
      this.updateCharts();
    }, 100);
  }

  toggleAutoRefresh(): void {
    console.log('🔄 Toggle auto-refresh:', !this.autoRefresh);
    this.autoRefresh = !this.autoRefresh;

    if (this.autoRefresh) {
      this.setupRealTimeUpdates();
    } else {
      this.subscriptions = this.subscriptions.filter(sub => {
        return sub !== this.subscriptions[this.subscriptions.length - 1];
      });
    }
  }

  toggleCompactView(): void {
    console.log('📱 Toggle vue compacte:', !this.compactView);
    this.compactView = !this.compactView;
  }

  refresh(): void {
    console.log('🔄 Actualisation dashboard');
    this.currentDate = new Date();
    this.loadDashboardData();
  }

  exportData(format: 'csv' | 'excel' | 'pdf'): void {
    console.log('📤 Export format:', format);
    this.showExportModal = true;
  }

  confirmExport(): void {
    console.log('✅ Confirmation export avec config:', this.exportConfig);
    this.showExportModal = false;

    this.dashboardService.exportDashboardData('csv', {
      timeRange: this.selectedTimeRange,
      config: this.exportConfig
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log('📥 Export terminé');
      },
      error: (err) => {
        console.error('❌ Erreur export:', err);
        alert('Erreur lors de l\'export. Vérifiez la console pour plus de détails.');
      }
    });
  }

  cancelExport(): void {
    console.log('❌ Annulation export');
    this.showExportModal = false;
  }

  private updateAnalytics(): void {
    const analyticsSub = this.dashboardService.getAnalytics({
      metric: this.selectedMetric,
      timeRange: this.selectedTimeRange
    }).subscribe({
      next: (analytics) => {
        if (this.dashboardData) {
          this.dashboardData.analytics = analytics;
          this.updateCharts();
        }
      },
      error: (err) => console.error('Erreur analytics:', err)
    });
    this.subscriptions.push(analyticsSub);
  }

  private updateOlapAnalysis(): void {
    const olapSub = this.dashboardService.getOlapAnalysis({
      dimensions: [this.selectedOlapDimension],
      timeRange: this.selectedTimeRange
    }).subscribe({
      next: (olap) => {
        if (this.dashboardData) {
          this.dashboardData.olap = olap;
          this.updateCharts();
        }
      },
      error: (err) => console.error('Erreur OLAP:', err)
    });
    this.subscriptions.push(olapSub);
  }

  // MÉTHODES DE FORMATAGE

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatDateSimple(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric'
    });
  }

  formatRoleName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ROLE_ADMIN': 'Admins',
      'ROLE_PROF': 'Profs',
      'ROLE_USER': 'Étudiants'
    };
    return roleMap[role] || role;
  }

  getGrowthIcon(current: number, previous: number): string {
    if (current > previous) return '📈';
    if (current < previous) return '📉';
    return '➡️';
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
      'utilisateur': '👤',
      'ue': '📚',
      'forum': '💬',
      'post': '📝',
      'admin': '⚙️',
      'system': '🖥️',
      'admin_panel': '⚙️',
      'departement': '🏢',
      'role': '🎭',
      'priorite': '⭐',
      'type': '🏷️',
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
      'get_current_user': 'Consultation profil',
      'dashboard_overview_accessed': 'Accès dashboard',
      'get_forum_by_id': 'Consultation forum',
      'get_detail_forum': 'Détails forum',
      'get_ue_by_id': 'Consultation UE',
      'get_participants_by_ue': 'Liste participants UE'
    };

    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatRelativeTime(timestamp: string | Date): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  formatTime(timestamp: string | Date): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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

  getUserDisplayName(user: any): string {
    if (!user) return 'Utilisateur inconnu';

    if (user.prenom && user.nom) {
      return `${user.prenom} ${user.nom}`;
    }

    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'Utilisateur';
  }

  getUserAvatar(user: any): string {
    if (user?.photo) {
      return user.photo.startsWith('http') ? user.photo : `http://localhost:3000/uploads/user/${user.photo}`;
    }
    return '/assets/default-avatar.png';
  }

  isRecentActivity(timestamp: string | Date): boolean {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMins = Math.floor((now.getTime() - time.getTime()) / 60000);
    return diffMins < 30;
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
}
