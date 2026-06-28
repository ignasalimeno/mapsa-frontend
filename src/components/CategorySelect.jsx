import { useState, useMemo } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography
} from '@mui/material'

function CategorySelect({ categories, value, onChange, label = 'Categoría', size = 'small', sx }) {
  const [selectedCategory, setSelectedCategory] = useState(
    value ? (value.parent_id || value.id) : ''
  )
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    value && value.parent_id ? value.id : ''
  )

  const parentCategories = useMemo(
    () => categories.filter(c => !c.parent_id),
    [categories]
  )

  const subcategories = useMemo(
    () => categories.filter(c => c.parent_id === Number(selectedCategory)),
    [categories, selectedCategory]
  )

  const handleCategoryChange = (e) => {
    const catId = e.target.value
    setSelectedCategory(catId)
    setSelectedSubcategory('')
    if (catId) {
      onChange({ id: catId })
    } else {
      onChange(null)
    }
  }

  const handleSubcategoryChange = (e) => {
    const subId = e.target.value
    setSelectedSubcategory(subId)
    if (subId) {
      onChange({ id: Number(subId) })
    } else if (selectedCategory) {
      onChange({ id: Number(selectedCategory) })
    }
  }

  return (
    <Stack direction="row" spacing={2} sx={sx}>
      <FormControl fullWidth size={size}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={selectedCategory}
          onChange={handleCategoryChange}
          label={label}
        >
          <MenuItem value="">
            <Typography variant="body2" color="text.secondary">Sin categoría</Typography>
          </MenuItem>
          {parentCategories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {subcategories.length > 0 && (
        <FormControl fullWidth size={size}>
          <InputLabel>Subcategoría</InputLabel>
          <Select
            value={selectedSubcategory}
            onChange={handleSubcategoryChange}
            label="Subcategoría"
          >
            <MenuItem value="">
              <Typography variant="body2" color="text.secondary">Todas</Typography>
            </MenuItem>
            {subcategories.map((sub) => (
              <MenuItem key={sub.id} value={sub.id}>
                {sub.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  )
}

export default CategorySelect
