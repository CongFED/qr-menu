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
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', sortOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (res.ok) setCategories(data.categories);
    } catch {}
    setLoading(false);
  }

  function openEdit(cat: Category) {
    setEditCat(cat);
    setFormData({ name: cat.name, sortOrder: cat.sortOrder, isActive: cat.isActive });
    setShowForm(true);
  }

  function openCreate() {
    setEditCat(null);
    setFormData({ name: '', sortOrder: categories.length + 1, isActive: true });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editCat ? `/api/admin/categories/${editCat.id}` : '/api/admin/categories';
      const res = await fetch(url, {
        method: editCat ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) { setShowForm(false); fetchData(); }
      else { const d = await res.json(); alert(d.error || 'Lỗi'); }
    } catch { alert('Lỗi'); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
      else { const d = await res.json(); alert(d.error || 'Lỗi'); }
    } catch {}
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
            <CategoryRoundedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Quản lý Danh mục
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              {categories.length} danh mục món ăn & đồ uống
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreate}
          sx={{
            px: 3,
            py: 1.25,
            borderRadius: '16px',
            fontWeight: 800,
            fontSize: '0.875rem',
            boxShadow: '0 4px 14px rgba(255, 91, 38, 0.35)',
          }}
        >
          Thêm danh mục
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
                    TÊN DANH MỤC
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    SLUG
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    SỐ MÓN
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    THỨ TỰ
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    TRẠNG THÁI
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    THAO TÁC
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow
                    key={cat.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <TableCell sx={{ py: 2.25, px: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {cat.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.25, px: 3, fontFamily: 'monospace', color: '#64748B', fontSize: '0.8rem' }}>
                      {cat.slug}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2.25, px: 3 }}>
                      <Chip
                        label={`${cat._count.products} món`}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0' }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2.25, px: 3, fontFamily: 'monospace', fontWeight: 700, color: '#64748B' }}>
                      {cat.sortOrder}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2.25, px: 3 }}>
                      <Chip
                        label={cat.isActive ? 'Hiển thị' : 'Ẩn'}
                        color={cat.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          px: 1,
                          borderRadius: '10px',
                          color: cat.isActive ? '#FFFFFF !important' : undefined,
                          bgcolor: cat.isActive ? '#16A34A !important' : undefined,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2.25, px: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditRoundedIcon sx={{ fontSize: 14 }} />}
                          onClick={() => openEdit(cat)}
                          sx={{
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1.5,
                            bgcolor: '#EFF6FF',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE',
                            '&:hover': { bgcolor: '#DBEAFE' },
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleDelete(cat.id)}
                          sx={{
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1.5,
                            bgcolor: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            '&:hover': { bgcolor: '#FEE2E2' },
                          }}
                        >
                          Xóa
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Edit/Create Form (MUI Dialog) */}
      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#0F172A' }}>
            {editCat ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          </Typography>
          <IconButton size="small" onClick={() => setShowForm(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 3 }}>
          <TextField
            label="Tên danh mục *"
            placeholder="Ví dụ: Món nướng than hoa"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            size="small"
            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
          />

          <TextField
            label="Thứ tự hiển thị"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            fullWidth
            size="small"
            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                color="primary"
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Đang hiển thị</Typography>}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowForm(false)} sx={{ color: '#64748B' }}>
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ px: 3, borderRadius: '14px', fontWeight: 800 }}
          >
            {saving ? 'Đang lưu...' : 'Lưu danh mục'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
