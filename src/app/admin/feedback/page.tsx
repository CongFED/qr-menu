'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Box,
  Rating,
  Chip,
  CircularProgress,
} from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { formatDateTime } from '@/lib/constants';

interface Feedback {
  id: string;
  orderId: string;
  customerName: string;
  tableNumber: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        const res = await fetch('/api/admin/feedback');
        const data = await res.json();
        if (res.ok) setFeedbacks(data.feedbacks);
      } catch {}
      setLoading(false);
    }
    fetchFeedback();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              bgcolor: 'rgba(255, 91, 38, 0.1)',
              color: '#FF5B26',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RateReviewRoundedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Đánh giá từ khách hàng
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              {feedbacks.length} phản hồi đã ghi nhận
            </Typography>
          </Box>
        </Box>

        {/* Avg Rating Badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: '#FFFBEB',
            border: '1px solid #FDE68A',
            px: 2.5,
            py: 1.2,
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.12)',
          }}
        >
          <StarRoundedIcon sx={{ color: '#F59E0B', fontSize: 24 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#92400E' }}>
            {avgRating} / 5.0
          </Typography>
        </Box>
      </Box>

      {/* Feedbacks List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {feedbacks.map((fb) => (
          <Card
            key={fb.id}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '24px',
              border: '1px solid #F1F5F9',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 12px -2px rgba(15, 23, 42, 0.03)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#E2E8F0',
                boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.06)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  {fb.customerName}
                </Typography>

                <Chip
                  icon={<TableRestaurantRoundedIcon sx={{ fontSize: 14 }} />}
                  label={`Bàn ${fb.tableNumber}`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    bgcolor: '#FFF7ED',
                    color: '#FF5B26',
                    border: '1px solid #FFEDD5',
                  }}
                />

                <Rating value={fb.rating} readOnly size="small" sx={{ color: '#F59E0B' }} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94A3B8' }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 13 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {formatDateTime(fb.createdAt)}
                </Typography>
              </Box>
            </Box>

            {fb.comment && (
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '16px', border: '1px solid #F1F5F9', mt: 1 }}>
                <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', lineHeight: 1.6 }}>
                  &ldquo;{fb.comment}&rdquo;
                </Typography>
              </Box>
            )}
          </Card>
        ))}

        {feedbacks.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 16, bgcolor: '#FFFFFF', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
            <RateReviewRoundedIcon sx={{ fontSize: 54, color: '#CBD5E1', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Chưa có đánh giá nào từ khách hàng
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              Phản hồi và chấm sao từ khách hàng sẽ được hiển thị tại đây
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
