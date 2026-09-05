'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { formatTime, STAFF_CALL_STATUS_LABELS, type StaffCallStatus } from '@/lib/constants';

interface StaffCall {
  id: string;
  tableName: string;
  tableNumber: number;
  customerName: string;
  status: string;
  createdAt: string;
}

export default function StaffCallsPage() {
  const [calls, setCalls] = useState<StaffCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/staff-calls');
      const data = await res.json();
      if (res.ok) setCalls(data.calls);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // SSE for realtime
  useEffect(() => {
    const es = new EventSource('/api/sse/orders?channel=staff-calls');
    es.addEventListener('new_staff_call', (e) => {
      const newCall = JSON.parse(e.data);
      setCalls((prev) => [newCall, ...prev]);
    });
    es.addEventListener('staff_call_updated', (e) => {
      const updated = JSON.parse(e.data);
      setCalls((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    });
    es.onerror = () => { es.close(); setTimeout(fetchCalls, 3000); };
    return () => es.close();
  }, [fetchCalls]);

  const handleUpdate = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/staff/staff-calls/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, status: data.call.status } : c)));
      }
    } catch {}
    setUpdatingId(null);
  };

  const pendingCalls = calls.filter((c) => c.status === 'PENDING');
  const otherCalls = calls.filter((c) => c.status !== 'PENDING');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Title */}
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
          <SupportAgentRoundedIcon sx={{ fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Khách gọi nhân viên
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            {pendingCalls.length} yêu cầu đang chờ hỗ trợ
          </Typography>
        </Box>
      </Box>

      {/* Pending Calls (Active alerts) */}
      {pendingCalls.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsActiveRoundedIcon sx={{ fontSize: 18 }} />
            <span>Yêu cầu đang chờ phục vụ ({pendingCalls.length})</span>
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            {pendingCalls.map((call) => (
              <Card
                key={call.id}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '24px',
                  border: '2px solid #FCA5A5',
                  bgcolor: '#FEF2F2',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  boxShadow: '0 8px 24px -4px rgba(239, 68, 68, 0.12)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '18px',
                        bgcolor: '#EF4444',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.35rem',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
                      }}
                    >
                      {call.tableNumber}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A' }}>
                        {call.tableName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                        Khách: <strong>{call.customerName}</strong>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {formatTime(call.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, pt: 1 }}>
                  <Button
                    variant="outlined"
                    disabled={updatingId === call.id}
                    onClick={() => handleUpdate(call.id, 'ACKNOWLEDGED')}
                    sx={{
                      borderRadius: '14px',
                      fontWeight: 800,
                      py: 1.2,
                      bgcolor: '#FFFBEB',
                      color: '#D97706',
                      borderColor: '#FDE68A',
                      '&:hover': { bgcolor: '#FEF3C7', borderColor: '#F59E0B' },
                    }}
                  >
                    Đã tiếp nhận
                  </Button>
                  <Button
                    variant="contained"
                    disabled={updatingId === call.id}
                    onClick={() => handleUpdate(call.id, 'RESOLVED')}
                    startIcon={<CheckCircleRoundedIcon />}
                    sx={{
                      borderRadius: '14px',
                      fontWeight: 800,
                      py: 1.2,
                      bgcolor: '#16A34A',
                      '&:hover': { bgcolor: '#15803D' },
                    }}
                  >
                    Đã xử lý xong
                  </Button>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Resolved Calls History */}
      {otherCalls.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748B' }}>
            Lịch sử hỗ trợ gần đây
          </Typography>

          <Card elevation={0} sx={{ borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
            <Box sx={{ divideY: '1px solid #F1F5F9' }}>
              {otherCalls.map((call) => (
                <Box
                  key={call.id}
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #F8FAFC',
                    '&:hover': { bgcolor: '#F8FAFC' },
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        bgcolor: '#F1F5F9',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                      }}
                    >
                      {call.tableNumber}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {call.tableName} • <span style={{ fontWeight: 500, color: '#64748B' }}>{call.customerName}</span>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        {formatTime(call.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    icon={call.status === 'RESOLVED' ? <DoneAllRoundedIcon sx={{ fontSize: 16 }} /> : <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
                    label={STAFF_CALL_STATUS_LABELS[call.status as StaffCallStatus]}
                    color={call.status === 'RESOLVED' ? 'success' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 800, borderRadius: '10px', px: 1 }}
                  />
                </Box>
              ))}
            </Box>
          </Card>
        </Box>
      )}

      {calls.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 16, bgcolor: '#FFFFFF', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
          <SupportAgentRoundedIcon sx={{ fontSize: 54, color: '#CBD5E1', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Không có yêu cầu gọi phục vụ
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Khi khách hàng tại bàn nhấn &quot;Gọi NV&quot;, thông báo sẽ lập tức hiển thị ở đây
          </Typography>
        </Box>
      )}
    </Box>
  );
}
