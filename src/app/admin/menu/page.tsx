'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import { formatPrice } from '@/lib/constants';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
  isAvailable: boolean;
  sortOrder: number;
  category: { id: string; name: string };
}

export default function AdminMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'editing'>('preview');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal form states
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: '',
    categoryId: '',
    isAvailable: true,
    sortOrder: 0,
    image: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (pRes.ok) setProducts(pData.products);
      if (cRes.ok) setCategories(cData.categories);
    } catch {}
    setLoading(false);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description || '',
      categoryId: product.category.id,
      isAvailable: product.isAvailable,
      sortOrder: product.sortOrder,
      image: product.image || '',
    });
    setShowForm(true);
  }

  function openCreate() {
    setEditProduct(null);
    setFormData({
      name: '',
      price: 0,
      description: '',
      categoryId: categories[0]?.id || '',
      isAvailable: true,
      sortOrder: 0,
      image: '',
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên món');
      return;
    }
    setSaving(true);
    try {
      const url = editProduct ? `/api/admin/products/${editProduct.id}` : '/api/admin/products';
      const method = editProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      alert('Có lỗi xảy ra');
    }
    setSaving(false);
  }

  async function handleToggleAvailability(product: Product) {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !product.isAvailable }),
      });
      if (res.ok) fetchData();
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm('Bạn có chắc muốn xóa món này khỏi menu?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch {}
  }

  const filteredProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => p.category.id === selectedCategory);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-14 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Segmented Pill Bar (Exact match to reference image) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Quản lý Thực đơn
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tổng cộng {products.length} món ăn & đồ uống
          </p>
        </div>

        {/* Segmented Control Bar matching reference: [Menu Editing] [Preview] */}
        <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center shadow-inner self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'preview'
                ? 'bg-white text-[#FF5B26] shadow-md shadow-slate-300/40'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🖼️ Xem dạng Thẻ (Cards)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editing')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'editing'
                ? 'bg-white text-[#FF5B26] shadow-md shadow-slate-300/40'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📝 Danh sách & Sửa (Table)
          </button>
        </div>

        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] hover:from-[#E04817] hover:to-[#D83B00] text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 self-start md:self-auto"
        >
          <span>+</span>
          <span>Thêm món mới</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`pill-tab text-xs ${
            selectedCategory === 'ALL' ? 'pill-tab-active' : 'pill-tab-inactive'
          }`}
        >
          Tất cả ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`pill-tab text-xs ${
              selectedCategory === cat.id ? 'pill-tab-active' : 'pill-tab-inactive'
            }`}
          >
            {cat.name} ({products.filter((p) => p.category.id === cat.id).length})
          </button>
        ))}
      </div>

      {/* VIEW MODE 1: MODERN CARDS GRID (Exact match to reference image) */}
      {activeTab === 'preview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-3xl p-5 border border-slate-100 shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between group ${
                !product.isAvailable ? 'opacity-70' : ''
              }`}
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-orange-50 to-amber-50">
                    🍽️
                  </div>
                )}

                {/* Top status indicator */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    onClick={() => handleToggleAvailability(product)}
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold cursor-pointer shadow-sm ${
                      product.isAvailable
                        ? 'bg-emerald-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                    title="Nhấn để đổi trạng thái"
                  >
                    {product.isAvailable ? 'Đang bán' : 'Hết hàng'}
                  </span>
                </div>

                {/* Floating edit button */}
                <div className="absolute bottom-2.5 right-2.5">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="w-8 h-8 bg-white/95 hover:bg-white text-slate-700 hover:text-[#FF5B26] rounded-full flex items-center justify-center shadow-md text-xs font-bold transition-all hover:scale-110"
                    title="Chỉnh sửa món"
                  >
                    ✏️
                  </button>
                </div>
              </div>

              {/* Title & Category */}
              <div className="mt-4 mb-3">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {product.category.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Thứ tự: {product.sortOrder}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base leading-snug truncate">
                  {product.name}
                </h3>
              </div>

              {/* Bottom Row: Price & Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
                  {formatPrice(product.price)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-xs"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
                    className="px-3.5 py-1.5 text-xs font-bold text-red-600 bg-red-50/80 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-xs"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODE 2: TABLE VIEW */}
      {activeTab === 'editing' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-bold text-slate-600 text-xs uppercase tracking-wider">
                    Món ăn
                  </th>
                  <th className="text-left px-5 py-3.5 font-bold text-slate-600 text-xs uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="text-right px-5 py-3.5 font-bold text-slate-600 text-xs uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="text-center px-5 py-3.5 font-bold text-slate-600 text-xs uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="text-center px-5 py-3.5 font-bold text-slate-600 text-xs uppercase tracking-wider">
                    Thứ tự
                  </th>
                  <th className="text-center px-5 py-3.5 font-bold text-slate-600 text-xs uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-slate-400 truncate max-w-xs">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {product.category.name}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(product)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                          product.isAvailable
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {product.isAvailable ? '✓ Đang bán' : '✕ Hết hàng'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-500 font-mono text-xs">
                      {product.sortOrder}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL (MUI Dialog) */}
      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: '24px', p: 1 } },
        }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#0F172A' }}>
            {editProduct ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
          </Typography>
          <IconButton size="small" onClick={() => setShowForm(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 3 }}>
          <TextField
            label="Tên món ăn *"
            placeholder="Ví dụ: Gà nướng Hòn Giao"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            size="small"
            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Giá bán (VNĐ) *"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
              }
              fullWidth
              size="small"
              slotProps={{ input: { sx: { borderRadius: '12px' } } }}
            />

            <FormControl fullWidth size="small">
              <InputLabel id="category-select-label">Danh mục *</InputLabel>
              <Select
                labelId="category-select-label"
                label="Danh mục *"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                sx={{ borderRadius: '12px' }}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Mô tả món ăn"
            placeholder="Mô tả hương vị, nguyên liệu, cách chế biến..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={2.5}
            fullWidth
            size="small"
            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
          />

          {/* Image Input & Upload */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Hình ảnh món ăn (URL hoặc Tải lên)"
              placeholder="Nhập URL ảnh hoặc bấm nút bên dưới để tải từ máy..."
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              fullWidth
              size="small"
              slotProps={{ input: { sx: { borderRadius: '12px' } } }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={
                  uploading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <CloudUploadRoundedIcon />
                  )
                }
                disabled={uploading}
                sx={{
                  borderRadius: '12px',
                  py: 0.8,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                {uploading ? 'Đang tải lên Cloudinary...' : 'Tải ảnh từ máy tính'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    const uploadForm = new FormData();
                    uploadForm.append('file', file);
                    try {
                      const res = await fetch('/api/admin/upload', {
                        method: 'POST',
                        body: uploadForm,
                      });
                      const data = await res.json();
                      if (res.ok && data.url) {
                        setFormData((prev) => ({ ...prev, image: data.url }));
                      } else {
                        alert(data.error || 'Tải ảnh lên Cloudinary thất bại');
                      }
                    } catch {
                      alert('Lỗi kết nối khi tải ảnh lên Cloudinary');
                    } finally {
                      setUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
              </Button>

              {formData.image && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 52,
                      height: 52,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1.5px solid #CBD5E1',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <Box
                      component="img"
                      src={formData.image}
                      alt="Preview"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 18,
                        height: 18,
                        bgcolor: 'rgba(0,0,0,0.65)',
                        color: '#FFFFFF',
                        '&:hover': { bgcolor: '#000000' },
                      }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>

                  {formData.image.includes('cloudinary') && (
                    <Chip
                      label="Cloudinary CDN"
                      size="small"
                      sx={{
                        fontSize: '11px',
                        height: 22,
                        bgcolor: '#EFF6FF',
                        color: '#1D4ED8',
                        fontWeight: 800,
                        border: '1px solid #BFDBFE',
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Thứ tự hiển thị"
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
              }
              fullWidth
              size="small"
              slotProps={{ input: { sx: { borderRadius: '12px' } } }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  color="primary"
                />
              }
              label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Đang mở bán</Typography>}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setShowForm(false)} sx={{ color: '#64748B' }}>
            Hủy bỏ
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || uploading}
            sx={{ px: 3, borderRadius: '14px' }}
          >
            {saving ? 'Đang lưu...' : 'Lưu món ăn'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
