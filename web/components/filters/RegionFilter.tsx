'use client'

import MultiSelect from '@/components/ui/MultiSelect'
import { REGIONS } from '@/lib/constants'

interface Props {
  selected: string[]
  onChange: (values: string[]) => void
}

const OPTIONS = REGIONS.map(r => ({ label: r, value: r }))

export default function RegionFilter({ selected, onChange }: Props) {
  return (
    <MultiSelect
      label="Region"
      options={OPTIONS}
      selected={selected}
      onChange={onChange}
      width="w-44"
    />
  )
}
