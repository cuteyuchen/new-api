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

const domWindow = new Window()
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLButtonElement',
  'SVGElement',
  'Node',
  'Element',
  'Event',
  'MouseEvent',
  'CustomEvent',
  'MutationObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
] as const) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: domWindow[key],
  })
}
Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverMock,
})

const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { ApiKeyGroupCombobox } = await import('../api-key-group-combobox')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        Group: 'Group',
        Ratio: 'Ratio',
        'Search...': 'Search...',
        'No group found.': 'No group found.',
      },
    },
  },
})

const reactTestGlobals = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}
reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true

describe('API key group combobox', () => {
  after(() => {
    domWindow.close()
  })

  test('selecting a compact group option calls the quick-switch callback', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    let selectedGroup = ''

    await act(async () => {
      root.render(
        <I18nextProvider i18n={i18n}>
          <ApiKeyGroupCombobox
            compact
            ariaLabel='Group'
            options={[
              { value: 'free', label: 'free', ratio: 0 },
              { value: 'paid', label: 'paid', ratio: 1 },
            ]}
            value='free'
            onValueChange={(group) => {
              selectedGroup = group
            }}
          />
        </I18nextProvider>
      )
    })

    const trigger = container.querySelector<HTMLButtonElement>(
      'button[role="combobox"]'
    )
    assert.ok(trigger)
    assert.equal(trigger.textContent?.includes('free'), true)

    await act(async () => {
      trigger.dispatchEvent(
        new domWindow.MouseEvent('click', {
          bubbles: true,
        }) as unknown as Event
      )
    })

    const paidOption = [
      ...document.body.querySelectorAll<HTMLElement>('[cmdk-item]'),
    ].find((item) => item.textContent?.includes('paid'))
    assert.ok(paidOption)

    await act(async () => {
      paidOption.dispatchEvent(
        new domWindow.MouseEvent('click', {
          bubbles: true,
        }) as unknown as Event
      )
    })

    assert.equal(selectedGroup, 'paid')

    await act(async () => root.unmount())
    container.remove()
  })
})
