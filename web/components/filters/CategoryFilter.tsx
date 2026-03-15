'use client'

import MultiSelect from '@/components/ui/MultiSelect'

interface Props {
  selected: string[]
  onChange: (values: string[]) => void
}

const OPTIONS = [
  'Electronics', 'Clothing', 'Food & Beverage',
  'Home & Garden', 'Sports', 'Books', 'Toys',
].map(c => ({ label: c, value: c }))

export default function CategoryFilter({ selected, onChange }: Props) {
  return (
    <MultiSelect
      label="Category"
      options={OPTIONS}
      selected={selected}
      onChange={onChange}
      width="w-52"
    />
  )
}
