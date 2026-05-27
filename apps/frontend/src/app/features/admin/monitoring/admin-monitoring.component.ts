import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AdminService, AdminHealthStatus } from '../../../core/services/admin.service';

type MonitorView = 'health' | 'api-logs' | 'errors' | 'metrics' | 'backups';

interface ServiceHealth { name: string; status: 'ok' | 'degraded' | 'down'; latency: string; icon: string; }
interface ApiLogEntry   { method: string; path: string; statusCode: number; duration: number; ip: string; time: string; }

@Component({
  selector: 'lg-admin-monitoring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Monitoring</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">System health, API logs, errors and server metrics</p>
    </div>
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-full" [class]="overallStatus() === 'ok' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'">
        <div class="w-2 h-2 rounded-full animate-pulse" [class]="overallStatus() === 'ok' ? 'bg-green-500' : 'bg-amber-500'"></div>
        <span class="text-xs font-semibold" [class]="overallStatus() === 'ok' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'">
          {{ overallStatus() === 'ok' ? 'All Systems Operational' : 'Degraded' }}
        </span>
      </div>
      <button (click)="refresh()"
        class="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <span class="material-icons text-[16px]">refresh</span> Refresh
      </button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
    <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 px-4">
      @for (t of tabs; track t.id) {
        <button (click)="activeView.set(t.id)"
          class="flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors shrink-0"
          [class]="activeView() === t.id
            ? 'border-green-600 text-green-600 dark:text-green-400 dark:border-green-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
          <span class="material-icons text-[16px]">{{ t.icon }}</span>
          {{ t.label }}
        </button>
      }
    </div>

    <!-- Health Tab -->
    @if (activeView() === 'health') {
      <div class="p-6 space-y-6">

        <!-- Uptime / version strip -->
        @if (health()) {
          <div class="flex flex-wrap gap-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm">
            <div><span class="text-gray-400 text-xs">Environment</span><p class="font-semibold text-gray-800 dark:text-gray-200 capitalize">{{ health()!.env }}</p></div>
            <div><span class="text-gray-400 text-xs">Version</span><p class="font-semibold text-gray-800 dark:text-gray-200">{{ health()!.version }}</p></div>
            <div><span class="text-gray-400 text-xs">Uptime</span><p class="font-semibold text-gray-800 dark:text-gray-200">{{ formatUptime(health()!.uptime) }}</p></div>
            <div><span class="text-gray-400 text-xs">Last Check</span><p class="font-semibold text-gray-800 dark:text-gray-200">{{ lastCheck() | date:'HH:mm:ss' }}</p></div>
          </div>
        }

        <!-- Service cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (svc of services(); track svc.name) {
            <div class="border rounded-xl p-5 transition-shadow hover:shadow-md" [class]="svcBorder(svc.status)">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center" [class]="svcBg(svc.status)">
                    <span class="material-icons text-[20px]" [class]="svcColor(svc.status)">{{ svc.icon }}</span>
                  </div>
                  <div>
                    <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ svc.name }}</p>
                    <p class="text-xs text-gray-400">{{ svc.latency }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <div class="w-2.5 h-2.5 rounded-full" [class]="statusDot(svc.status)"></div>
                  <span class="text-xs font-semibold capitalize" [class]="svcColor(svc.status)">{{ svc.status }}</span>
                </div>
              </div>
              <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1">
                <div class="h-1 rounded-full" [class]="svc.status === 'ok' ? 'bg-green-500' : svc.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'" style="width: 100%"></div>
              </div>
            </div>
          }
        </div>

        <!-- Performance meters -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Performance Indicators</h3>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            @for (m of perfMetrics(); track m.label) {
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ m.label }}</p>
                  <span class="text-xs font-bold" [class]="m.color">{{ m.value }}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all" [class]="m.barColor" [style.width]="m.pct + '%'"></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- API Logs Tab -->
    @if (activeView() === 'api-logs') {
      <div class="p-4 space-y-4">
        <div class="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
          <table class="w-full text-sm font-mono">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Method</th>
                <th class="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Path</th>
                <th class="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th class="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Duration</th>
                <th class="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">IP</th>
                <th class="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              @for (log of apiLogs(); track $index) {
                <tr class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-4 py-2.5">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold" [class]="methodBadge(log.method)">{{ log.method }}</span>
                  </td>
                  <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 max-w-[220px] truncate">{{ log.path }}</td>
                  <td class="px-4 py-2.5">
                    <span class="text-xs font-bold" [class]="log.statusCode < 300 ? 'text-green-600' : log.statusCode < 500 ? 'text-amber-500' : 'text-red-500'">
                      {{ log.statusCode }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5 text-xs" [class]="log.duration > 500 ? 'text-amber-500 font-semibold' : 'text-gray-500'">{{ log.duration }}ms</td>
                  <td class="px-4 py-2.5 text-xs text-gray-400">{{ log.ip }}</td>
                  <td class="px-4 py-2.5 text-xs text-gray-400">{{ log.time }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="text-center py-12 text-gray-400">No API logs — logs persist in-memory per session</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Error Logs -->
    @if (activeView() === 'errors') {
      <div class="p-4 space-y-3">
        @for (err of errorLogs(); track err.id) {
          <div class="border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 rounded-xl p-4">
            <div class="flex items-start gap-3">
              <span class="material-icons text-red-500 text-[18px] mt-0.5">error</span>
              <div class="flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-semibold text-sm text-red-800 dark:text-red-300">{{ err.message }}</p>
                  <span class="text-xs text-red-400 shrink-0">{{ err.time }}</span>
                </div>
                <p class="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">{{ err.path }}</p>
                @if (err.stack) {
                  <details class="mt-2">
                    <summary class="text-xs text-red-400 cursor-pointer">Stack trace</summary>
                    <pre class="text-[10px] text-red-500 mt-1 overflow-x-auto max-h-24">{{ err.stack }}</pre>
                  </details>
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="text-center py-16">
            <span class="material-icons text-green-300 text-[48px] block mb-2">check_circle</span>
            <p class="text-gray-400">No errors logged. All systems healthy!</p>
          </div>
        }
      </div>
    }

    <!-- Metrics -->
    @if (activeView() === 'metrics') {
      <div class="p-6 space-y-6">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (m of serverMetrics(); track m.label) {
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">{{ m.label }}</p>
              <p class="text-3xl font-bold" [class]="m.color">{{ m.value }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ m.sub }}</p>
            </div>
          }
        </div>
        <div class="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex items-start gap-3">
          <span class="material-icons text-amber-500">info</span>
          <div>
            <p class="text-sm font-medium text-amber-800 dark:text-amber-300">Real-time Metrics</p>
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">For full server metrics (CPU, memory, disk I/O), integrate PM2 monitoring or connect a Prometheus/Grafana stack. The health endpoint at <code class="bg-amber-100 dark:bg-amber-800/30 px-1 rounded">/health</code> provides basic status.</p>
          </div>
        </div>
      </div>
    }

    <!-- Backups -->
    @if (activeView() === 'backups') {
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (b of backupStatus; track b.name) {
            <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" [class]="b.status === 'ok' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-amber-50 dark:bg-amber-900/30'">
                  <span class="material-icons text-[20px]" [class]="b.status === 'ok' ? 'text-green-500' : 'text-amber-500'">{{ b.icon }}</span>
                </div>
                <div>
                  <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ b.name }}</p>
                  <p class="text-xs text-gray-400">{{ b.desc }}</p>
                </div>
              </div>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-400">Last Backup</span>
                  <span class="text-gray-700 dark:text-gray-300 font-medium">{{ b.lastRun }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Schedule</span>
                  <span class="text-gray-700 dark:text-gray-300 font-medium">{{ b.schedule }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Status</span>
                  <span class="font-semibold" [class]="b.status === 'ok' ? 'text-green-500' : 'text-amber-500'">{{ b.status | titlecase }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  </div>
</div>
  `,
})
export class AdminMonitoringComponent implements OnInit, OnDestroy {
  readonly #admin  = inject(AdminService);
  readonly #http   = inject(HttpClient);

  readonly activeView   = signal<MonitorView>('health');
  readonly health       = signal<AdminHealthStatus | null>(null);
  readonly apiLogs      = signal<ApiLogEntry[]>([]);
  readonly errorLogs    = signal<Array<{id:number;message:string;path:string;stack?:string;time:string}>>([]);
  readonly lastCheck    = signal(new Date());

  #interval: ReturnType<typeof setInterval> | null = null;

  readonly tabs = [
    { id: 'health'   as MonitorView, label: 'Health',        icon: 'health_and_safety' },
    { id: 'api-logs' as MonitorView, label: 'API Logs',      icon: 'api' },
    { id: 'errors'   as MonitorView, label: 'Error Logs',    icon: 'error' },
    { id: 'metrics'  as MonitorView, label: 'Server Metrics',icon: 'speed' },
    { id: 'backups'  as MonitorView, label: 'Backups',       icon: 'backup' },
  ];

  readonly overallStatus = computed(() => {
    const h = this.health();
    if (!h) return 'unknown';
    return h.status;
  });

  readonly services = computed((): ServiceHealth[] => {
    const h = this.health();
    if (!h) return [];
    return [
      { name: 'MySQL',         status: (h.checks['mysql'] ?? 'down') as ServiceHealth['status'],         latency: '< 5ms',   icon: 'storage' },
      { name: 'Redis',         status: (h.checks['redis'] ?? 'degraded') as ServiceHealth['status'],     latency: '< 1ms',   icon: 'memory' },
      { name: 'Elasticsearch', status: (h.checks['elasticsearch'] ?? 'degraded') as ServiceHealth['status'], latency: '< 10ms', icon: 'search' },
      { name: 'Express API',   status: 'ok',  latency: h.uptime + 's uptime', icon: 'api' },
      { name: 'Socket.IO',     status: 'ok',  latency: 'realtime', icon: 'electric_bolt' },
      { name: 'Node Process',  status: 'ok',  latency: 'v' + (h.version || '1.0'), icon: 'developer_board' },
    ];
  });

  readonly perfMetrics = computed(() => {
    const h = this.health();
    return [
      { label: 'API Uptime',    value: h ? this.formatUptime(h.uptime) : '—', pct: 99, color: 'text-green-600', barColor: 'bg-green-500' },
      { label: 'MySQL',         value: h?.checks['mysql'] === 'ok' ? '✓' : '✗', pct: h?.checks['mysql'] === 'ok' ? 100 : 0, color: h?.checks['mysql'] === 'ok' ? 'text-green-600' : 'text-red-500', barColor: 'bg-green-500' },
      { label: 'Redis',         value: h?.checks['redis'] === 'ok' ? '✓' : '~',  pct: h?.checks['redis'] === 'ok' ? 100 : 60, color: h?.checks['redis'] === 'ok' ? 'text-green-600' : 'text-amber-500', barColor: 'bg-amber-500' },
      { label: 'Elasticsearch', value: h?.checks['elasticsearch'] === 'ok' ? '✓' : '~', pct: h?.checks['elasticsearch'] === 'ok' ? 100 : 60, color: h?.checks['elasticsearch'] === 'ok' ? 'text-green-600' : 'text-amber-500', barColor: 'bg-amber-500' },
    ];
  });

  readonly serverMetrics = computed(() => [
    { label: 'Process Uptime', value: this.health() ? this.formatUptime(this.health()!.uptime) : '—', sub: 'since last restart', color: 'text-green-600 dark:text-green-400' },
    { label: 'Environment',    value: this.health()?.env ?? '—',   sub: 'runtime mode',        color: 'text-blue-600 dark:text-blue-400' },
    { label: 'API Version',    value: this.health()?.version ?? '—', sub: 'package.json version', color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Node.js',        value: '20.x', sub: 'runtime version', color: 'text-amber-600 dark:text-amber-400' },
  ]);

  readonly backupStatus = [
    { name: 'MySQL Backup',    icon: 'storage', desc: 'Full database backup',    status: 'configure', lastRun: 'Not configured', schedule: 'Daily 2:00 AM' },
    { name: 'File Backup',     icon: 'folder',  desc: 'Uploads & media files',   status: 'configure', lastRun: 'Not configured', schedule: 'Weekly' },
    { name: 'Redis Snapshot',  icon: 'memory',  desc: 'Cache persistence (RDB)', status: 'ok',        lastRun: 'Auto on startup', schedule: 'On shutdown' },
  ];

  ngOnInit(): void {
    const url = window.location.pathname;
    if (url.includes('/api-logs'))  this.activeView.set('api-logs');
    else if (url.includes('/errors')) this.activeView.set('errors');
    else if (url.includes('/metrics')) this.activeView.set('metrics');
    else if (url.includes('/backups')) this.activeView.set('backups');

    this.checkHealth();
    this.#interval = setInterval(() => this.checkHealth(), 30000);
  }

  ngOnDestroy(): void {
    if (this.#interval) clearInterval(this.#interval);
  }

  checkHealth(): void {
    this.#admin.getHealthStatus().subscribe({
      next: res => {
        // /health returns plain json, not wrapped in success/data
        this.health.set(res as unknown as AdminHealthStatus);
        this.lastCheck.set(new Date());
      },
      error: () => {
        // Try direct health endpoint
        this.#http.get<AdminHealthStatus>('/health').subscribe({
          next: data => { this.health.set(data); this.lastCheck.set(new Date()); },
          error: () => this.health.set(null),
        });
      },
    });
    this.loadApiLogs();
  }

  loadApiLogs(): void {
    this.#admin.getApiLogs().subscribe({
      next: res => this.apiLogs.set(res.data.map(l => ({
        method: l.method, path: l.path, statusCode: l.statusCode,
        duration: l.duration, ip: l.ip,
        time: new Date(l.createdAt).toLocaleTimeString(),
      }))),
      error: () => {},
    });
  }

  refresh(): void { this.checkHealth(); }

  formatUptime(sec: number): string {
    if (sec < 60)   return sec + 's';
    if (sec < 3600) return Math.floor(sec / 60) + 'm';
    if (sec < 86400) return Math.floor(sec / 3600) + 'h ' + Math.floor((sec % 3600) / 60) + 'm';
    return Math.floor(sec / 86400) + 'd ' + Math.floor((sec % 86400) / 3600) + 'h';
  }

  svcBorder(s: string): string {
    return s === 'ok' ? 'border-green-200 dark:border-green-800/40' : s === 'degraded' ? 'border-amber-200 dark:border-amber-800/40' : 'border-red-200 dark:border-red-800/40';
  }
  svcBg(s: string): string {
    return s === 'ok' ? 'bg-green-50 dark:bg-green-900/30' : s === 'degraded' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-red-50 dark:bg-red-900/30';
  }
  svcColor(s: string): string {
    return s === 'ok' ? 'text-green-600 dark:text-green-400' : s === 'degraded' ? 'text-amber-600 dark:text-amber-400' : 'text-red-500';
  }
  statusDot(s: string): string {
    return s === 'ok' ? 'bg-green-500 animate-pulse' : s === 'degraded' ? 'bg-amber-500 animate-pulse' : 'bg-red-500';
  }
  methodBadge(m: string): string {
    const map: Record<string, string> = {
      GET:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      POST:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
      PATCH:  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      PUT:    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
      DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    };
    return map[m] ?? 'bg-gray-100 text-gray-600';
  }
}
