import { Autocomplete, TextField } from '@mui/material'
import TagChip from './TagChip'

const normalizeId = (value) => String(value)

function TagMultiSelect({
  options = [],
  value = [],
  onChange,
  mode = 'ids',
  label = 'Tags',
  placeholder = 'Buscar y seleccionar tags...',
  fullWidth = true,
  size = 'small',
  sx = {},
}) {
  const selectedOptions =
    mode === 'objects'
      ? value
      : options.filter((tag) => value.map(normalizeId).includes(normalizeId(tag.id)))

  return (
    <Autocomplete
      multiple
      fullWidth={fullWidth}
      size={size}
      options={options}
      value={selectedOptions}
      onChange={(_, newValue) => {
        if (mode === 'objects') {
          onChange?.(newValue)
          return
        }
        onChange?.(newValue.map((tag) => tag.id))
      }}
      getOptionLabel={(option) => option?.name || ''}
      isOptionEqualToValue={(option, selected) => normalizeId(option.id) === normalizeId(selected.id)}
      renderTags={(selected, getTagProps) =>
        selected.map((tag, index) => (
          <TagChip
            key={tag.id}
            tag={tag}
            {...getTagProps({ index })}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
        />
      )}
      sx={{ minWidth: 280, ...sx }}
    />
  )
}

export default TagMultiSelect
