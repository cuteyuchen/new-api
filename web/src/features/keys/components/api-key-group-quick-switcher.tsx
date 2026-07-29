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
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getUserGroups } from '@/lib/api'

import { updateApiKeyGroup } from '../api'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'
import type { ApiKey } from '../types'
import {
  ApiKeyGroupCombobox,
  type ApiKeyGroupOption,
} from './api-key-group-combobox'
import { useApiKeys } from './api-keys-provider'

type ApiKeyGroupQuickSwitcherProps = {
  apiKey: ApiKey
}

export function ApiKeyGroupQuickSwitcher(props: ApiKeyGroupQuickSwitcherProps) {
  const { t } = useTranslation()
  const { triggerRefresh } = useApiKeys()
  const [isUpdating, setIsUpdating] = useState(false)
  const { data: groupsData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['user-groups'],
    queryFn: getUserGroups,
    staleTime: 0,
  })
  const currentGroup = props.apiKey.group || ''

  const options = useMemo((): ApiKeyGroupOption[] => {
    const groups = groupsData?.success ? groupsData.data : undefined
    const result: ApiKeyGroupOption[] = Object.entries(groups ?? {}).map(
      ([value, info]) => ({
        value,
        label: value,
        desc: info.desc || value,
        ratio: info.ratio,
      })
    )

    if (
      currentGroup &&
      !result.some((option) => option.value === currentGroup)
    ) {
      result.unshift({ value: currentGroup, label: currentGroup })
    }

    return result
  }, [currentGroup, groupsData])

  const handleGroupChange = useCallback(
    async (group: string) => {
      if (group === currentGroup) return

      setIsUpdating(true)
      try {
        const result = await updateApiKeyGroup(props.apiKey.id, group)
        if (result.success) {
          toast.success(t(SUCCESS_MESSAGES.API_KEY_UPDATED))
          triggerRefresh()
          return
        }
        toast.error(result.message || t(ERROR_MESSAGES.UPDATE_FAILED))
      } catch {
        toast.error(t(ERROR_MESSAGES.UNEXPECTED))
      } finally {
        setIsUpdating(false)
      }
    },
    [currentGroup, props.apiKey.id, t, triggerRefresh]
  )

  return (
    <ApiKeyGroupCombobox
      compact
      options={options}
      value={currentGroup}
      onValueChange={(group) => void handleGroupChange(group)}
      disabled={isLoadingGroups || isUpdating || options.length < 2}
      ariaLabel={t('Group')}
    />
  )
}
