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

import assert from 'node:assert/strict'
import { after, describe, test } from 'node:test'

import { Window } from 'happy-dom'
import type React from 'react'

const domWindow = new Window()
for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'SVGElement',
  'Node',
  'Element',
  'Event',
  'CustomEvent',
  'MutationObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
] as const) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: domWindow[key],
  })
}

const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { ModelChannelList } = await import('../model-channel-list')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Channels: 'Channels',
        Healthy: 'Healthy',
        Disabled: 'Disabled',
        'Not monitored': 'Not monitored',
        'Success rate': 'Success rate',
        Latency: 'Latency',
      },
    },
  },
})

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

async function renderChannelList(
  props: React.ComponentProps<typeof ModelChannelList>
) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <ModelChannelList {...props} />
      </I18nextProvider>
    )
  })
  return { container, root }
}

describe('model channel list', () => {
  after(() => {
    domWindow.close()
  })

  test('shows every channel name and its visible health status', async () => {
    const rendered = await renderChannelList({
      variant: 'compact',
      channels: [
        {
          id: 1,
          name: '公益站-A',
          group: 'free',
          status: 'healthy',
          success_rate: 100,
          median_latency_ms: 1200,
          last_checked: '2026-07-29T01:00:00Z',
        },
        {
          id: 2,
          name: '官方订阅',
          group: 'official',
          status: 'disabled',
          success_rate: 0,
          median_latency_ms: 0,
          last_checked: '',
        },
      ],
    })

    assert.equal(rendered.container.textContent?.includes('公益站-A'), true)
    assert.equal(rendered.container.textContent?.includes('Healthy'), true)
    assert.equal(rendered.container.textContent?.includes('官方订阅'), true)
    assert.equal(rendered.container.textContent?.includes('Disabled'), true)
    assert.equal(
      rendered.container.querySelectorAll('[data-channel-status]').length,
      2
    )

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('does not render an empty channel section', async () => {
    const rendered = await renderChannelList({ channels: [] })

    assert.equal(rendered.container.textContent, '')
    assert.equal(rendered.container.querySelector('section'), null)

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('shows per-channel metrics by default and allows collapsing', async () => {
    const rendered = await renderChannelList({
      variant: 'detail',
      channels: [
        {
          id: 1,
          name: '公益站-A',
          group: 'free',
          status: 'healthy',
          success_rate: 98.5,
          median_latency_ms: 860,
          last_checked: '2026-07-29T01:00:00Z',
        },
      ],
    })
    const trigger = rendered.container.querySelector('button')

    assert.ok(trigger)
    assert.equal(trigger.getAttribute('aria-expanded'), 'true')
    assert.match(
      rendered.container.querySelector('[data-channel-metrics]')?.textContent ??
        '',
      /98\.5%/
    )

    await act(async () => trigger.click())

    assert.equal(trigger.getAttribute('aria-expanded'), 'false')
    assert.equal(rendered.container.querySelector('[data-channel-metrics]'), null)

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })

  test('does not show success metrics for image model channels', async () => {
    const rendered = await renderChannelList({
      variant: 'detail',
      showMetrics: false,
      channels: [
        {
          id: 2,
          name: '图片渠道',
          group: 'paid',
          status: 'unmonitored',
          success_rate: 100,
          median_latency_ms: 500,
          last_checked: '2026-07-29T01:00:00Z',
        },
      ],
    })
    const trigger = rendered.container.querySelector('button')

    assert.ok(trigger)
    assert.equal(rendered.container.textContent?.includes('图片渠道'), true)
    assert.equal(rendered.container.textContent?.includes('Not monitored'), true)
    assert.equal(rendered.container.querySelector('[data-channel-metrics]'), null)

    await act(async () => rendered.root.unmount())
    rendered.container.remove()
  })
})
