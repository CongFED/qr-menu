'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '', password: '', role: 'STAFF' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch {}
    setLoading(false);
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) { setShowForm(false); fetchUsers(); }
      else { const d = await res.json(); alert(d.error || 'Lỗi'); }
    } catch { alert('Lỗi'); }
    setSaving(false);
  }

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
            <PeopleAltRoundedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Quản lý Người dùng
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Tài khoản quản trị viên và nhân viên phục vụ
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<PersonAddRoundedIcon />}
          onClick={() => { setFormData({ email: '', name: '', password: '', role: 'STAFF' }); setShowForm(true); }}
          sx={{
            px: 3,
            py: 1.25,
            borderRadius: '16px',
            fontWeight: 800,
            fontSize: '0.875rem',
            boxShadow: '0 4px 14px rgba(255, 91, 38, 0.35)',
          }}
        >
          Thêm người dùng
        </Button>
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
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    HỌ VÀ TÊN
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    EMAIL ĐĂNG NHẬP
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    VAI TRÒ
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    TRẠNG THÁI
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <TableCell sx={{ py: 2.25, px: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {user.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.25, px: 3, color: '#64748B', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {user.email}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2.25, px: 3 }}>
                      <Chip
                        icon={user.role === 'ADMIN' ? <AdminPanelSettingsRoundedIcon sx={{ fontSize: 16 }} /> : <BadgeRoundedIcon sx={{ fontSize: 16 }} />}
                        label={user.role === 'ADMIN' ? 'Quản trị (Admin)' : 'Nhân viên (Staff)'}
                        color={user.role === 'ADMIN' ? 'secondary' : 'primary'}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.72rem', px: 1, borderRadius: '10px' }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2.25, px: 3 }}>
                      <Chip
                        label={user.isActive ? 'Hoạt động' : 'Tạm khóa'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          px: 1,
                          borderRadius: '10px',
                          color: user.isActive ? '#FFFFFF !important' : undefined,
                          bgcolor: user.isActive ? '#16A34A !important' : undefined,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Create User Dialog */}
      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Thêm người dùng mới
          </Typography>
          <IconButton size="small" onClick={() => setShowForm(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 3 }}>
          <TextField
            label="Họ và tên *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            size="small"
            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
          />

          <TextField
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
            size="small"
            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
          />

          <TextField
            label="Mật khẩu *"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            fullWidth
            size="small"
            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
          />

          <FormControl fullWidth size="small">
            <InputLabel id="user-role-label">Vai trò *</InputLabel>
            <Select
              labelId="user-role-label"
              label="Vai trò *"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              sx={{ borderRadius: '12px' }}
            >
              <MenuItem value="STAFF">Nhân viên phục vụ (Staff)</MenuItem>
              <MenuItem value="ADMIN">Quản trị viên (Admin)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowForm(false)} sx={{ color: '#64748B' }}>
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving}
            sx={{ px: 3, borderRadius: '14px', fontWeight: 800 }}
          >
            {saving ? 'Đang lưu...' : 'Tạo tài khoản'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
