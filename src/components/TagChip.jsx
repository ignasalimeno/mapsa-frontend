import { Chip } from '@mui/material'
import { LocalOffer as TagIcon } from '@mui/icons-material'

const TagChip = ({ tag, size = 'small', onDelete }) => {
  return (
    <Chip
      icon={<TagIcon />}
      label={tag.name}
      size={size}
      onDelete={onDelete}
      sx={{
        bgcolor: tag.color || 'primary.main',
        color: 'white',
        '& .MuiChip-icon': {
          color: 'white'
        }
      }}
    />
  )
}

export default TagChip
