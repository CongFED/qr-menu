'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/constants';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
  isAvailable: boolean;
}

interface Props {
  product: Product;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: Props) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      image: product.image || undefined,
      quantity,
      note,
    });
    setAdded(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: '24px 24px 0 0', sm: '28px' },
            m: { xs: 0, sm: 2 },
            position: { xs: 'fixed', sm: 'relative' },
            bottom: { xs: 0, sm: 'auto' },
            maxHeight: '92vh',
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Top Close Button */}
      <IconButton
        onClick={onClose}
        size="small"
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          bgcolor: 'rgba(0,0,0,0.5)',
          color: '#FFFFFF',
          backdropFilter: 'blur(4px)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>

      {/* Product Image */}
      <Box sx={{ position: 'relative', width: '100%', height: 200, bgcolor: '#F8FAFC' }}>
        {product.image ? (
          <Box
            component="img"
            src={product.image}
            alt={product.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            <RestaurantMenuRoundedIcon sx={{ fontSize: 60 }} />
          </Box>
        )}
      </Box>

      {/* Dialog Body */}
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5, lineHeight: 1.3 }}>
          {product.name}
        </Typography>

        <Typography variant="h5" sx={{ fontWeight: 900, color: '#FF5B26', mb: 2 }}>
          {formatPrice(product.price)}
        </Typography>

        {product.description && (
          <Box
            sx={{
              p: 2,
              mb: 2.5,
              bgcolor: '#F8FAFC',
              borderRadius: '16px',
              border: '1px solid #F1F5F9',
            }}
          >
            <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
              {product.description}
            </Typography>
          </Box>
        )}

        {/* Stepper Quantity */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}
          >
            Số lượng
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              sx={{
                width: 42,
                height: 42,
                borderRadius: '14px',
                border: '1.5px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                color: '#0F172A',
                '&:hover': { bgcolor: '#F8FAFC' },
              }}
            >
              <RemoveRoundedIcon />
            </IconButton>

            <Typography variant="h6" sx={{ fontWeight: 800, minWidth: 28, textAlign: 'center' }}>
              {quantity}
            </Typography>

            <IconButton
              onClick={() => setQuantity(quantity + 1)}
              sx={{
                width: 42,
                height: 42,
                borderRadius: '14px',
                bgcolor: '#FF5B26',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(255, 91, 38, 0.35)',
                '&:hover': { bgcolor: '#E04817' },
              }}
            >
              <AddRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Cooking Note */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}
          >
            Ghi chú chế biến
          </Typography>
          <TextField
            fullWidth
            placeholder="Ví dụ: Ít cay, không hành, làm chín kỹ..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            size="small"
            slotProps={{
              input: {
                sx: {
                  borderRadius: '14px',
                  bgcolor: '#F8FAFC',
                  fontSize: '0.875rem',
                },
              },
            }}
          />
        </Box>

        {/* Add to Cart Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleAdd}
          disabled={!product.isAvailable || added}
          sx={{
            py: 1.75,
            borderRadius: '18px',
            fontSize: '1rem',
            fontWeight: 800,
            background: added
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #FF6B35 0%, #FF4500 100%)',
            boxShadow: added
              ? '0 8px 24px rgba(16, 185, 129, 0.35)'
              : '0 8px 24px rgba(255, 91, 38, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          {added ? (
            <>
              <CheckCircleRoundedIcon />
              <span>ĐÃ THÊM VÀO GIỎ HÀNG</span>
            </>
          ) : (
            <>
              <span>THÊM VÀO GIỎ</span>
              <span>•</span>
              <span>{formatPrice(product.price * quantity)}</span>
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
