/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gauge,
  RefreshCw,
  Route as RouteIcon,
  Server,
  XCircle,
  Zap,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getPerfMetricsSummary } from '@/features/performance-metrics/api'
import type { PerfModelSummary } from '@/features/performance-metrics/types'
import { cn } from '@/lib/utils'

import { getModelStatus } from './api'
import { ModelChannelList } from './components/model-channel-list'
import type { HealthPoint, HealthStatus, ModelHealth } from './types'

type DisplayModel = ModelHealth & {
  perf?: PerfModelSummary
}

const statusMeta: Record<
  HealthStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  healthy: {
    label: '正常',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  degraded: {
    label: '警告',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    icon: AlertTriangle,
  },
  down: {
    label: '异常',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
    icon: XCircle,
  },
  unknown: {
    label: '待检测',
    className: 'border-border bg-muted text-muted-foreground',
    icon: Clock3,
  },
  unmonitored: {
    label: '不探测',
    className:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
    icon: Clock3,
  },
}

function formatNumber(value: number | undefined, digits = 0) {
  if (value === undefined || !Number.isFinite(value)) return '—'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '等待首次检测'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: HealthStatus }) {
  const meta = statusMeta[status]
  const Icon = meta.icon
  return (
    <Badge
      variant='outline'
      className={cn('gap-1 font-medium', meta.className)}
    >
      <Icon className='size-3' />
      {meta.label}
    </Badge>
  )
}

function HistoryBars({ history }: { history: HealthPoint[] }) {
  if (history.length === 0) {
    return (
      <div className='text-muted-foreground text-xs'>
        完成首次探测后显示近 24 小时趋势
      </div>
    )
  }

  return (
    <div className='flex h-9 items-end gap-1' aria-label='近 24 小时可用性'>
      {history.slice(-96).map((point) => (
        <div
          key={point.ts}
          className={cn(
            'min-w-1 flex-1 rounded-sm',
            point.status === 'healthy' && 'h-full bg-emerald-500',
            point.status === 'degraded' && 'h-4/5 bg-amber-500',
            point.status === 'down' && 'h-3/5 bg-red-500',
            point.status === 'unknown' && 'h-2/5 bg-muted-foreground/30'
          )}
          title={`${new Date(point.ts * 1000).toLocaleString('zh-CN')} · ${statusMeta[point.status].label}`}
        />
      ))}
    </div>
  )
}

function ModelCard({ model }: { model: DisplayModel }) {
  const { t } = useTranslation()
  const probeSupported = model.probe_supported !== false
  const latency = model.perf?.avg_latency_ms ?? model.median_latency_ms

  return (
    <Card className='border-border/70 overflow-hidden shadow-sm transition-shadow hover:shadow-md'>
      <CardContent className='space-y-5 p-5'>
        <div className='flex items-start justify-between gap-4'>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl'>
                <Server className='size-4' />
              </div>
              <h2
                className='truncate text-base font-semibold'
                title={model.name}
              >
                {model.name}
              </h2>
              <StatusBadge status={model.status} />
            </div>
            <div className='text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs'>
              <span>
                可用线路 {model.available_routes}/{model.total_routes}
              </span>
              {probeSupported && (
                <span>中位延迟 {formatNumber(latency)} ms</span>
              )}
              <span>真实请求 {formatNumber(model.perf?.request_count)}</span>
              <span>TPS {formatNumber(model.perf?.avg_tps, 1)}</span>
            </div>
          </div>
          <div className='shrink-0 text-right'>
            <div className='text-2xl font-bold tabular-nums'>
              {probeSupported
                ? `${formatNumber(model.success_rate, 1)}%`
                : t('Not monitored')}
            </div>
            <div className='text-muted-foreground text-xs'>
              {probeSupported
                ? t('Enabled channel success rate')
                : t('Image models are not actively probed')}
            </div>
          </div>
        </div>

        {probeSupported && <HistoryBars history={model.history} />}

        <ModelChannelList
          channels={model.channels ?? []}
          variant='detail'
          showMetrics={probeSupported}
        />

        <div className='text-muted-foreground flex items-center justify-between text-xs'>
          <div className='flex flex-wrap gap-1.5'>
            {model.groups.map((group) => (
              <Badge key={group} variant='secondary' className='font-normal'>
                {group}
              </Badge>
            ))}
          </div>
          <span>
            {probeSupported
              ? `更新于 ${formatTime(model.last_checked)}`
              : t('Image models are not actively probed')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: typeof Activity
}) {
  return (
    <Card className='border-border/70'>
      <CardContent className='p-4'>
        <div className='text-muted-foreground flex items-center gap-2 text-xs'>
          <Icon className='size-4' />
          {label}
        </div>
        <div className='mt-2 text-2xl font-bold tabular-nums'>{value}</div>
        <div className='text-muted-foreground mt-1 text-xs'>{hint}</div>
      </CardContent>
    </Card>
  )
}

export function ModelStatus() {
  const { t } = useTranslation()
  const statusQuery = useQuery({
    queryKey: ['public-model-status'],
    queryFn: getModelStatus,
    refetchInterval: 60_000,
    retry: 1,
  })
  const perfQuery = useQuery({
    queryKey: ['perf-metrics-summary', 24],
    queryFn: () => getPerfMetricsSummary(24),
    refetchInterval: 60_000,
    retry: false,
  })

  const perfByModel = useMemo(
    () =>
      new Map(
        (perfQuery.data?.data.models ?? []).map((model) => [
          model.model_name,
          model,
        ])
      ),
    [perfQuery.data]
  )
  const models = useMemo(
    () =>
      (statusQuery.data?.models ?? [])
        .map((model) => ({ ...model, perf: perfByModel.get(model.name) }))
        .sort((a, b) => {
          const order: Record<HealthStatus, number> = {
            down: 0,
            degraded: 1,
            unknown: 2,
            unmonitored: 3,
            healthy: 4,
          }
          return (
            order[a.status] - order[b.status] || a.name.localeCompare(b.name)
          )
        }),
    [perfByModel, statusQuery.data]
  )
  const counts = useMemo(
    () =>
      models.reduce(
        (result, model) => {
          result[model.status] += 1
          return result
        },
        { healthy: 0, degraded: 0, down: 0, unknown: 0, unmonitored: 0 }
      ),
    [models]
  )
  const monitoredModels = models.filter(
    (model) => model.probe_supported !== false
  )
  const averageLatency =
    monitoredModels.length > 0
      ? monitoredModels.reduce(
          (total, model) =>
            total +
            (model.perf?.avg_latency_ms ?? model.median_latency_ms ?? 0),
          0
        ) / monitoredModels.length
      : 0

  const refresh = () => {
    void statusQuery.refetch()
    void perfQuery.refetch()
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative min-h-[calc(100vh-4rem)] overflow-hidden'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 top-0 h-96 opacity-20 dark:opacity-10'
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 50% 0%, oklch(0.65 0.18 250 / 75%), transparent 75%)',
          }}
        />
        <PageTransition className='relative mx-auto w-full max-w-7xl px-4 pt-20 pb-12 sm:px-6'>
          <div className='flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-2xl shadow-lg'>
                <Activity className='size-5' />
              </div>
              <div>
                <h1 className='text-2xl font-bold'>模型状态</h1>
                <p className='text-muted-foreground mt-1 text-sm'>
                  每 15 分钟主动检测模型可用性，并结合近 24 小时真实请求指标
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <span className='text-muted-foreground text-xs'>
                更新于 {formatTime(statusQuery.data?.generated_at ?? '')}
              </span>
              <Button
                size='sm'
                variant='outline'
                onClick={refresh}
                disabled={statusQuery.isFetching}
              >
                <RefreshCw
                  className={cn(
                    'mr-2 size-4',
                    statusQuery.isFetching && 'animate-spin'
                  )}
                />
                刷新
              </Button>
            </div>
          </div>

          {statusQuery.isLoading && (
            <div className='mt-8 grid gap-4 md:grid-cols-2'>
              {['one', 'two', 'three', 'four', 'five', 'six'].map((key) => (
                <Skeleton key={key} className='h-52 rounded-xl' />
              ))}
            </div>
          )}
          {!statusQuery.isLoading && statusQuery.isError && (
            <Card className='mt-8 border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'>
              <CardContent className='flex items-center gap-3 p-6 text-amber-800 dark:text-amber-200'>
                <AlertTriangle className='size-5' />
                健康监控正在初始化，请在首次检测完成后刷新。
              </CardContent>
            </Card>
          )}
          {!statusQuery.isLoading && !statusQuery.isError && (
            <>
              <div className='mt-6 flex flex-wrap gap-2'>
                <Badge
                  variant='outline'
                  className={statusMeta.healthy.className}
                >
                  正常 {counts.healthy}
                </Badge>
                <Badge
                  variant='outline'
                  className={statusMeta.degraded.className}
                >
                  警告 {counts.degraded}
                </Badge>
                <Badge variant='outline' className={statusMeta.down.className}>
                  异常 {counts.down}
                </Badge>
                {counts.unknown > 0 && (
                  <Badge variant='outline'>待检测 {counts.unknown}</Badge>
                )}
                {counts.unmonitored > 0 && (
                  <Badge
                    variant='outline'
                    className={statusMeta.unmonitored.className}
                  >
                    {t('Not monitored')} {counts.unmonitored}
                  </Badge>
                )}
              </div>

              <div className='mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                <SummaryCard
                  label='监控模型'
                  value={formatNumber(models.length)}
                  hint='已归一化后的公开模型'
                  icon={RouteIcon}
                />
                <SummaryCard
                  label='近 24 小时探测'
                  value={formatNumber(statusQuery.data?.summary.probe_count)}
                  hint='不计入用户用量与账单'
                  icon={Zap}
                />
                <SummaryCard
                  label={t('Enabled channel success rate')}
                  value={`${formatNumber(statusQuery.data?.summary.success_rate, 1)}%`}
                  hint={t('Only currently enabled channels are included')}
                  icon={Gauge}
                />
                <SummaryCard
                  label='平均延迟'
                  value={`${formatNumber(averageLatency)} ms`}
                  hint='优先使用真实请求指标'
                  icon={Clock3}
                />
              </div>

              <div className='mt-8 flex items-center justify-between'>
                <div>
                  <h2 className='font-semibold'>模型可用性</h2>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    绿 ≥95% · 黄 80–95% · 红 &lt;80% 或当前无可用线路
                  </p>
                </div>
                <div className='text-muted-foreground hidden items-center gap-3 text-xs sm:flex'>
                  <span className='flex items-center gap-1'>
                    <i className='size-2 rounded-sm bg-emerald-500' /> 正常
                  </span>
                  <span className='flex items-center gap-1'>
                    <i className='size-2 rounded-sm bg-amber-500' /> 警告
                  </span>
                  <span className='flex items-center gap-1'>
                    <i className='size-2 rounded-sm bg-red-500' /> 异常
                  </span>
                </div>
              </div>

              {models.length === 0 ? (
                <Card className='mt-4'>
                  <CardContent className='text-muted-foreground p-8 text-center'>
                    暂无模型探测数据。
                  </CardContent>
                </Card>
              ) : (
                <div className='mt-4 grid gap-4 lg:grid-cols-2'>
                  {models.map((model) => (
                    <ModelCard key={model.name} model={model} />
                  ))}
                </div>
              )}
            </>
          )}
        </PageTransition>
      </div>
    </PublicLayout>
  )
}
