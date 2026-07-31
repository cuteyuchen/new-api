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
import { describe, test } from 'node:test'

import {
  CHANNEL_FORM_DEFAULT_VALUES,
  transformFormDataToCreatePayload,
  transformFormDataToUpdatePayload,
} from '../channel-form'

describe('channel balance form payload', () => {
  test('sends the NewAPI balance token separately from the model API key', () => {
    const payload = transformFormDataToCreatePayload({
      ...CHANNEL_FORM_DEFAULT_VALUES,
      name: 'NewAPI upstream',
      key: 'model-api-key',
      models: 'gpt-5',
      balance_type: 'newapi',
      balance_token: 'system-access-token',
    })

    assert.equal(payload.balance_token, 'system-access-token')
    assert.equal(payload.channel.key, 'model-api-key')
  })

  test('keeps an explicit empty token when clearing a saved token', () => {
    const payload = transformFormDataToUpdatePayload(
      {
        ...CHANNEL_FORM_DEFAULT_VALUES,
        name: 'NewAPI upstream',
        models: 'gpt-5',
        balance_type: 'newapi',
        clear_balance_token: true,
      },
      42
    )

    assert.equal(payload.balance_token, '')
  })
})
