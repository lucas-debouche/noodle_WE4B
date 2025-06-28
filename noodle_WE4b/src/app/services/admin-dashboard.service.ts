// admin-dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DashboardFilters {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  includeOlap?: boolean;
  includeRealtime?: boolean;
  departments?: string[];
  roles?: string[];
}

export interface OlapFilters {
  dimensions?: string[];
  measures?: string[];
  timeRange?: string;
  drillDown?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = 'http://localhost:3000/api/admin/dashboard';

  constructor(private http: HttpClient) {}

  // ===============================
  // MÉTHODES PRINCIPALES
  // ===============================

  getDashboardData(filters: DashboardFilters = {}): Observable<any> {
    let params = new HttpParams();

    if (filters.timeRange) params = params.set('timeRange', filters.timeRange);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.includeOlap) params = params.set('includeOlap', 'true');
    if (filters.includeRealtime) params = params.set('includeRealtime', 'true');
    if (filters.departments) params = params.set('departments', filters.departments.join(','));
    if (filters.roles) params = params.set('roles', filters.roles.join(','));

    return this.http.get<any>(`${this.apiUrl}/overview`, { params });
  }

  getAnalytics(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analytics`, filters);
  }

  getOlapAnalysis(filters: OlapFilters): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/olap`, filters);
  }

  getDetailedOlapAnalysis(filters: OlapFilters): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/olap/detailed`, filters);
  }

  getRealTimeData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/realtime`);
  }

  getSystemMetrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/metrics`);
  }

  // ===============================
  // ANALYSES SPÉCIALISÉES
  // ===============================

  getUserActivityAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analysis/user-activity`, filters);
  }

  getUeParticipationAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analysis/ue-participation`, filters);
  }

  getForumEngagementAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analysis/forum-engagement`, filters);
  }

  getPerformanceAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analysis/performance`, filters);
  }

  getCohortAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analysis/cohort`, filters);
  }

  getRetentionAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analysis/retention`, filters);
  }

  getUsagePatternAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/analysis/usage-patterns`, filters);
  }

  // ===============================
  // ANALYSES TEMPORELLES AVANCÉES
  // ===============================

  getTimeSeriesAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/timeseries`, filters);
  }

  getSeasonalityAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seasonality`, filters);
  }

  getTrendAnalysis(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/trends`, filters);
  }

  getAnomalyDetection(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/anomalies`, filters);
  }

  // ===============================
  // ANALYSES GÉOGRAPHIQUES
  // ===============================

  getGeographicalDistribution(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/geographical`);
  }

  getRegionalActivity(filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/regional-activity`, filters);
  }

  // ===============================
  // EXPORT ET RAPPORTS
  // ===============================

  exportDashboardData(format: 'csv' | 'excel' | 'pdf', filters: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export/${format}`, filters, {
      responseType: 'blob'
    });
  }

  generateReport(reportType: string, filters: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reports/${reportType}`, filters);
  }

  scheduleReport(reportConfig: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reports/schedule`, reportConfig);
  }

  // ===============================
  // UTILITIES POUR FORMATAGE
  // ===============================

  formatTimeSeriesData(data: any[]): any {
    if (!data || !Array.isArray(data)) return { labels: [], datasets: [] };

    const labels = data.map(item => this.formatDate(item._id || item.date));
    const datasets = [
      {
        label: 'Utilisateurs Actifs',
        data: data.map(item => item.activeUsers || 0),
        borderColor: '#f47d42',
        backgroundColor: 'rgba(244, 125, 66, 0.1)',
        tension: 0.4
      },
      {
        label: 'Nouvelles Sessions',
        data: data.map(item => item.newSessions || 0),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Actions Totales',
        data: data.map(item => item.totalActions || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }
    ];

    return { labels, datasets };
  }

  formatPieChartData(data: any[]): any {
    if (!data || !Array.isArray(data)) return { labels: [], datasets: [] };

    const labels = data.map(item => this.formatRoleName(item._id));
    const backgroundColors = [
      '#f47d42', '#3b82f6', '#10b981', '#f59e0b',
      '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
    ];

    return {
      labels,
      datasets: [{
        data: data.map(item => item.count || 0),
        backgroundColor: backgroundColors.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  formatHeatmapData(data: any[]): any[] {
    if (!data || !Array.isArray(data)) return [];

    return data.map(item => ({
      x: item.hour || item.timeSlot,
      y: item.role || item.category,
      v: item.activity || item.value || 0,
      label: `${item.activity || item.value || 0} actions`
    }));
  }

  formatBarChartData(data: any[], labelKey: string, valueKey: string): any {
    if (!data || !Array.isArray(data)) return { labels: [], datasets: [] };

    return {
      labels: data.map(item => item[labelKey]),
      datasets: [{
        label: 'Valeurs',
        data: data.map(item => item[valueKey] || 0),
        backgroundColor: '#f47d42',
        borderColor: '#e67e22',
        borderWidth: 1
      }]
    };
  }

  // ===============================
  // UTILITIES DE FORMATAGE
  // ===============================

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric'
    });
  }

  private formatRoleName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ROLE_ADMIN': 'Administrateurs',
      'ROLE_PROF': 'Professeurs',
      'ROLE_USER': 'Étudiants'
    };
    return roleMap[role] || role;
  }

  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  getHealthStatus(metrics: any): 'healthy' | 'warning' | 'critical' {
    const { errorRate, responseTime, memoryUsage } = metrics;

    if (errorRate > 5 || responseTime > 2000 || memoryUsage > 90) {
      return 'critical';
    }
    if (errorRate > 2 || responseTime > 1000 || memoryUsage > 75) {
      return 'warning';
    }
    return 'healthy';
  }

  // ===============================
  // CACHE ET OPTIMISATION
  // ===============================

  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(endpoint: string, params: any): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private getCachedData(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}
