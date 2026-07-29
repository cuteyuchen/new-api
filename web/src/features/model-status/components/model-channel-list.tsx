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

import { ChevronDown } from 'lucide-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

import type { ChannelHealthStatus, ModelChannelHealth } from '../types'

const channelStatusMeta: Record<
  ChannelHealthStatus,
  { label: string; dotClassName: string; textClassName: string }
> = {
  healthy: {
    label: 'Healthy',
    dotClassName: 'bg-emerald-500',
    textClassName: 'text-emerald-700 dark:text-emerald-300',
  },
  degraded: {
    label: 'Warning',
    dotClassName: 'bg-amber-500',
    textClassName: 'text-amber-700 dark:text-amber-300',
  },
  down: {
    label: 'Error',
    dotClassName: 'bg-red-500',
    textClassName: 'text-red-700 dark:text-red-300',
  },
  unknown: {
    label: 'Unknown',
    dotClassName: 'bg-muted-foreground/40',
    textClassName: 'text-muted-foreground',
  },
  unmonitored: {
    label: 'Not monitored',
    dotClassName: 'bg-sky-400',
    textClassName: 'text-sky-700 dark:text-sky-300',
  },
  disabled: {
    label: 'Disabled',
    dotClassName: 'bg-slate-400',
    textClassName: 'text-muted-foreground',
  },
}

export interface ModelChannelListProps {
  channels: ModelChannelHealth[]
  variant?: 'compact' | 'detail'
  showMetrics?: boolean
}

export const ModelChannelList = memo(function ModelChannelList(
  props: ModelChannelListProps
) {
  const { t } = useTranslation()
  const compact = props.variant === 'compact'
  const showMetrics = props.showMetrics !== false

  if (props.channels.length === 0) {
    return null
  }

  const channelGrid = (
    <div
      className={cn(
        compact ? 'flex flex-wrap gap-1.5' : 'grid gap-2 sm:grid-cols-2'
      )}
    >
      {props.channels.map((channel) => {
        const meta = channelStatusMeta[channel.status]
        const hasMetrics = showMetrics && Boolean(channel.last_checked)

        return (
          <div
            key={channel.id}
            data-channel-status={channel.status}
            aria-label={`${channel.name}: ${t(meta.label)}`}
            className={cn(
              'border-border/70 bg-muted/20 min-w-0 border',
              compact
                ? 'flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px]'
                : 'rounded-lg px-3 py-2'
            )}
          >
            <div
              className={cn(
                'min-w-0',
                compact
                  ? 'flex items-center gap-1.5'
                  : 'flex items-center justify-between gap-2'
              )}
            >
              <span className='flex min-w-0 items-center gap-1.5'>
                <i
                  aria-hidden='true'
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    meta.dotClassName
                  )}
                />
                <span className='truncate font-medium' title={channel.name}>
                  {channel.name}
                </span>
              </span>
              {!compact && (
                <span className='text-muted-foreground shrink-0 text-[11px]'>
                  {channel.group}
                </span>
              )}
            </div>

            <span
              className={cn(
                'shrink-0 font-medium',
                meta.textClassName,
                !compact && 'mt-1 block text-xs'
              )}
            >
              {t(meta.label)}
            </span>

            {!compact && hasMetrics && (
              <span
                data-channel-metrics
                className='text-muted-foreground mt-1 block text-[11px]'
              >
                {t('Success rate')} {channel.success_rate.toFixed(1)}% ·{' '}
                {t('Latency')} {channel.median_latency_ms.toLocaleString()} ms
              </span>
            )}
          </div>
        )
      })}
    </div>
  )

  if (compact) {
    return <section aria-label={t('Channels')}>{channelGrid}</section>
  }

  return (
    <section aria-label={t('Channels')}>
      <Collapsible defaultOpen>
        <CollapsibleTrigger className='group border-border/70 bg-muted/20 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'>
          <span className='flex items-center gap-2'>
            {t('Channels')}
            <span className='text-muted-foreground tabular-nums'>
              {props.channels.length}
            </span>
          </span>
          <ChevronDown
            aria-hidden='true'
            className='text-muted-foreground size-4 transition-transform group-data-[panel-open]:rotate-180 motion-reduce:transition-none'
          />
        </CollapsibleTrigger>
        <CollapsibleContent className='pt-2'>{channelGrid}</CollapsibleContent>
      </Collapsible>
    </section>
  )
})
