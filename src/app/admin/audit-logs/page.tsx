'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import ManageHistoryRoundedIcon from '@mui/icons-material/ManageHistoryRounded';
import { formatDateTime } from '@/lib/constants';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user: { name: string; email: string; role: string } | null;
}

const actionChips: Record<string, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'; label: string }> = {
  CREATE: { color: 'success', label: 'TẠO MỚI' },
  UPDATE: { color: 'info', label: 'CẬP NHẬT' },
  STATUS_CHANGE: { color: 'warning', label: 'ĐỔI TRẠNG THÁI' },
  DELETE: { color: 'error', label: 'XÓA' },
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/audit-logs');
        const data = await res.json();
        if (res.ok) setLogs(data.logs);
      } catch {}
      setLoading(false);
    }
    fetchLogs();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
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
          <ManageHistoryRoundedIcon sx={{ fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Nhật ký hoạt động (Audit Logs)
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Lưu lại toàn bộ lịch sử chỉnh sửa giá món, đổi trạng thái và tạo đơn
          </Typography>
        </Box>
      </Box>

      {/* Table Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: '1px solid #F1F5F9',
          bgcolor: '#FFFFFF',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    THỜI GIAN
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    NGƯỜI THỰC HIỆN
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    HÀNH ĐỘNG
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    ĐỐI TƯỢNG
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    CHI TIẾT THAY ĐỔI
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const chip = actionChips[log.action] || { color: 'default', label: log.action };
                  return (
                    <TableRow
                      key={log.id}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <TableCell sx={{ py: 2.25, px: 3, whiteSpace: 'nowrap', color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell sx={{ py: 2.25, px: 3, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {log.user ? `${log.user.name} (${log.user.role})` : 'Hệ thống / Khách'}
                      </TableCell>
                      <TableCell sx={{ py: 2.25, px: 3 }}>
                        <Chip
                          label={chip.label}
                          color={chip.color}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.7rem', px: 0.5, borderRadius: '8px' }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.25, px: 3, fontWeight: 700, color: '#475569' }}>
                        {log.entity}
                      </TableCell>
                      <TableCell sx={{ py: 2.25, px: 3, fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748B', maxWidth: 320 }}>
                        {log.details || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
