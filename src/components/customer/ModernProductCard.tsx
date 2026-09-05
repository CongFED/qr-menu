'use client';

import { Card, CardMedia, Typography, Box, IconButton, Chip } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import { formatPrice } from '@/lib/constants';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
  isAvailable: boolean;
  categoryId: string;
}

interface Props {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onOpenDetail: () => void;
}

export default function ModernProductCard({
  product,
  quantity,
  onAdd,
  onRemove,
  onOpenDetail,
}: Props) {
  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2 },
        borderRadius: '22px',
        border: '1px solid #F1F5F9',
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: product.isAvailable ? 1 : 0.65,
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 14px 30px -4px rgba(255, 91, 38, 0.12), 0 4px 14px -2px rgba(15, 23, 42, 0.04)',
          borderColor: '#FED7AA',
        },
      }}
    >
      {/* Top Image Container with generous rounded corners */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: '16px',
          overflow: 'hidden',
          bgcolor: '#F8FAFC',
        }}
      >
        {product.image ? (
          <CardMedia
            component="img"
            image={product.image}
            alt={product.name}
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.35s ease',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
              color: '#FF5B26',
            }}
          >
            <RestaurantMenuRoundedIcon sx={{ fontSize: 36 }} />
          </Box>
        )}

        {/* Floating Detail Button (...) in bottom-right corner */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail();
          }}
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 28,
            height: 28,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            color: '#334155',
            boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              bgcolor: '#FFFFFF',
              color: '#FF5B26',
              transform: 'scale(1.1)',
            },
          }}
          title="Xem chi tiết"
        >
          <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>

        {/* Out of stock badge */}
        {!product.isAvailable && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(1px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Chip
              label="Hết món"
              color="error"
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Box>
        )}
      </Box>

      {/* Product Title & Description with proper spacing */}
      <Box sx={{ mt: 1.5, mb: 1.5, cursor: 'pointer' }} onClick={onOpenDetail}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: '#0F172A',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.7em',
            '&:hover': { color: '#FF5B26' },
            transition: 'color 0.15s ease',
          }}
        >
          {product.name}
        </Typography>
        {product.description && (
          <Typography
            variant="caption"
            sx={{
              color: '#64748B',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 0.5,
              fontSize: '0.72rem',
              lineHeight: 1.3,
            }}
          >
            {product.description}
          </Typography>
        )}
      </Box>

      {/* Bottom Row: Price & Actions with NO overlap */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pt: 1.25,
          borderTop: '1px solid #F1F5F9',
          mt: 'auto',
          gap: 1,
        }}
      >
        <Typography
          sx={{
            fontWeight: 900,
            color: '#FF5B26',
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {formatPrice(product.price)}
        </Typography>

        {product.isAvailable ? (
          quantity === 0 ? (
            /* Clean single '+' button when quantity is 0 - lots of room for price */
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '10px',
                bgcolor: '#FF5B26',
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(255, 91, 38, 0.35)',
                '&:hover': {
                  bgcolor: '#E04817',
                  boxShadow: '0 4px 10px rgba(255, 91, 38, 0.45)',
                },
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          ) : (
            /* Compact stepper when item is added */
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: '#F8FAFC',
                p: '3px 4px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '6px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#334155',
                  p: 0,
                  '&:hover': { bgcolor: '#F1F5F9' },
                }}
              >
                <RemoveRoundedIcon sx={{ fontSize: 13 }} />
              </IconButton>

              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: '#0F172A',
                  minWidth: 15,
                  textAlign: 'center',
                  fontSize: '0.75rem',
                }}
              >
                {quantity}
              </Typography>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '6px',
                  bgcolor: '#FF5B26',
                  color: '#FFFFFF',
                  p: 0,
                  '&:hover': {
                    bgcolor: '#E04817',
                  },
                }}
              >
                <AddRoundedIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          )
        ) : (
          <Chip label="Tạm ngưng" size="small" variant="outlined" sx={{ height: 22, fontSize: '0.62rem' }} />
        )}
      </Box>
    </Card>
  );
}
