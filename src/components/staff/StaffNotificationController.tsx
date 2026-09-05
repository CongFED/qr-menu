'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  Chip,
  Portal,
} from '@mui/material';
import {
  notifyNewOrder,
  notifyStaffCall,
  playOrderChime,
  speakVietnamese,
} from '@/lib/sound';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import SoupKitchenRoundedIcon from '@mui/icons-material/SoupKitchenRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

interface ToastAlert {
  id: string;
  type: 'ORDER' | 'CALL';
  title: string;
  message: string;
  tableName: string;
  link: string;
  createdAt: number;
}

export default function StaffNotificationController() {
  const router = useRouter();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showTestModal, setShowTestModal] = useState(false);
  const [activeAlert, setActiveAlert] = useState<ToastAlert | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioEnabledRef = useRef(audioEnabled);
  audioEnabledRef.current = audioEnabled;

  // Track initial user interaction to unlock Web Audio context
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      // Pre-warm audio & speech
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // SSE Listener for real-time Order and Staff Call notifications
  useEffect(() => {
    const orderES = new EventSource('/api/sse/orders?channel=staff-orders');
    const callES = new EventSource('/api/sse/orders?channel=staff-calls');

    // Handle New Order
    orderES.addEventListener('new_order', (event) => {
      try {
        const data = JSON.parse(event.data);
        const tableName = data.table?.name || `Bàn ${data.table?.number || ''}`;
        const customerName = data.customerName;

        // Sound + Voice announcement
        if (audioEnabledRef.current) {
          notifyNewOrder(tableName, customerName);
        }

        // Show Visual Alert Toast
        setActiveAlert({
          id: data.id || String(Date.now()),
          type: 'ORDER',
          title: `ĐƠN MÓN MỚI: ${tableName}`,
          message: `${customerName || 'Khách'} vừa đặt ${data.items?.length || 1} món (${data.orderNumber})`,
          tableName,
          link: '/staff/orders',
          createdAt: Date.now(),
        });
      } catch (err) {
        console.error('Error handling new_order event:', err);
      }
    });

    // Handle New Staff Call
    callES.addEventListener('new_staff_call', (event) => {
      try {
        const data = JSON.parse(event.data);
        const tableName = data.tableName || `Bàn ${data.tableNumber}`;
        const customerName = data.customerName;

        // Sound + Voice announcement
        if (audioEnabledRef.current) {
          notifyStaffCall(tableName, customerName);
        }

        // Show Visual Alert Toast
        setActiveAlert({
          id: data.id || String(Date.now()),
          type: 'CALL',
          title: `KHÁCH GỌI BÀN: ${tableName}`,
          message: `${customerName || 'Khách'} đang cần nhân viên hỗ trợ!`,
          tableName,
          link: '/staff/calls',
          createdAt: Date.now(),
        });
      } catch (err) {
        console.error('Error handling new_staff_call event:', err);
      }
    });

    return () => {
      orderES.close();
      callES.close();
    };
  }, []);

  // Auto-dismiss alert after 10 seconds
  useEffect(() => {
    if (activeAlert) {
      const timer = setTimeout(() => {
        setActiveAlert(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeAlert]);

  // Test sound function
  const handleTestOrderSound = () => {
    setHasInteracted(true);
    notifyNewOrder('Bàn 01', 'Nguyễn Văn A');
  };

  const handleTestCallSound = () => {
    setHasInteracted(true);
    notifyStaffCall('Bàn 02', 'Chị Mai');
  };

  return (
    <>
      {/* Sound Status Bar in Header */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setHasInteracted(true);
            setAudioEnabled(!audioEnabled);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            audioEnabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-xs'
              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
          }`}
          title={audioEnabled ? 'Chuông báo đang BẬT. Nhấn để tắt tiếng.' : 'Chuông báo đang TẮT. Nhấn để bật.'}
        >
          {audioEnabled ? (
            <VolumeUpRoundedIcon sx={{ fontSize: 16 }} />
          ) : (
            <VolumeOffRoundedIcon sx={{ fontSize: 16 }} />
          )}
          <span className="hidden lg:inline">{audioEnabled ? 'Chuông: BẬT' : 'Chuông: TẮT'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowTestModal(true)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1"
          title="Thử loa & giọng đọc"
        >
          <CampaignRoundedIcon sx={{ fontSize: 15, color: '#FF5B26' }} />
          <span>Thử chuông</span>
        </button>
      </div>

      {/* Unlocked Audio Prompt Banner (portal rendered at document.body) */}
      {!hasInteracted && (
        <Portal>
          <div
            onClick={() => {
              setHasInteracted(true);
              playOrderChime();
            }}
            className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 cursor-pointer hover:shadow-2xl transition-all animate-bounce-subtle"
          >
            <NotificationsActiveRoundedIcon sx={{ fontSize: 22 }} />
            <div className="text-xs">
              <p className="font-extrabold">Bấm vào đây để kích hoạt chuông bếp</p>
              <p className="opacity-90">Trình duyệt cần quyền phát âm thanh thông báo</p>
            </div>
            <span className="bg-white/20 px-2 py-1 rounded-lg font-bold text-[11px]">BẬT LOA</span>
          </div>
        </Portal>
      )}

      {/* Floating Alert Banner on Event (portal rendered at document.body) */}
      {activeAlert && (
        <Portal>
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-down">
            <div
              onClick={() => {
                router.push(activeAlert.link);
                setActiveAlert(null);
              }}
              className={`p-4 rounded-3xl shadow-2xl border cursor-pointer transition-all hover:scale-102 ${
                activeAlert.type === 'CALL'
                  ? 'bg-rose-500 text-white border-rose-600 ring-4 ring-rose-400/30'
                  : 'bg-slate-900 text-white border-slate-800 ring-4 ring-orange-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      activeAlert.type === 'CALL' ? 'bg-white/20' : 'bg-[#FF5B26]'
                    }`}
                  >
                    {activeAlert.type === 'CALL' ? (
                      <NotificationsActiveRoundedIcon sx={{ fontSize: 24 }} />
                    ) : (
                      <SoupKitchenRoundedIcon sx={{ fontSize: 24 }} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base leading-tight">
                      {activeAlert.title}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">{activeAlert.message}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAlert(null);
                  }}
                  className="text-white/70 hover:text-white p-1"
                >
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs font-bold">
                <span>Nhấn vào để mở màn hình xử lý</span>
                <span className="flex items-center gap-1 underline">
                  Xem ngay <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
                </span>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Test Sound Modal Using MUI Dialog (React Portal - Never Clipped by Header) */}
      <Dialog
        open={showTestModal}
        onClose={() => setShowTestModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '28px',
              p: 2.5,
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #F1F5F9',
            },
          },
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 0,
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                bgcolor: 'rgba(255, 91, 38, 0.1)',
                color: '#FF5B26',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CampaignRoundedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Kiểm tra âm thanh & giọng đọc
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setShowTestModal(false)}
            sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' } }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 1.6 }}>
            Hệ thống kết hợp <strong>tiếng chuông vang</strong> và <strong>giọng đọc tiếng Việt</strong> phát rõ bàn nào vừa đặt món hoặc gọi phục vụ.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Test Order Button */}
            <Box
              onClick={handleTestOrderSound}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: '18px',
                bgcolor: '#FFF7ED',
                border: '1px solid #FFEDD5',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#FFEDD5', transform: 'translateY(-1px)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '14px',
                    bgcolor: '#FFFFFF',
                    color: '#FF5B26',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(255, 91, 38, 0.15)',
                  }}
                >
                  <SoupKitchenRoundedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9A3412', fontSize: '0.85rem' }}>
                    Chuông báo Đặt món
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#C2410C', display: 'block', mt: 0.25 }}>
                    Chuông ngân + Đọc &quot;Bàn 01 vừa đặt món&quot;
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: '#FFFFFF',
                  color: '#EA580C',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <PlayArrowRoundedIcon sx={{ fontSize: 16 }} />
                <span>Phát</span>
              </Box>
            </Box>

            {/* Test Call Button */}
            <Box
              onClick={handleTestCallSound}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: '18px',
                bgcolor: '#FEF2F2',
                border: '1px solid #FEE2E2',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#FEE2E2', transform: 'translateY(-1px)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '14px',
                    bgcolor: '#FFFFFF',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.15)',
                  }}
                >
                  <NotificationsActiveRoundedIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#991B1B', fontSize: '0.85rem' }}>
                    Chuông Khách gọi phục vụ
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#B91C1C', display: 'block', mt: 0.25 }}>
                    Chuông Ting-Ting + Đọc &quot;Bàn 02 đang gọi...&quot;
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: '#FFFFFF',
                  color: '#DC2626',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <PlayArrowRoundedIcon sx={{ fontSize: 16 }} />
                <span>Phát</span>
              </Box>
            </Box>
          </Box>

          {/* Audio State Toggle Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: 2,
              borderTop: '1px solid #F1F5F9',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
              Trạng thái chuông:
            </Typography>
            <Chip
              label={audioEnabled ? 'Đang bật' : 'Đang tắt'}
              color={audioEnabled ? 'success' : 'default'}
              size="small"
              onClick={() => setAudioEnabled(!audioEnabled)}
              sx={{
                fontWeight: 800,
                borderRadius: '10px',
                px: 1,
                cursor: 'pointer',
                ...(audioEnabled && {
                  color: '#FFFFFF !important',
                  bgcolor: '#16A34A !important',
                  '& .MuiChip-label': { color: '#FFFFFF !important' },
                }),
              }}
            />
          </Box>

          {/* Close button */}
          <Button
            variant="contained"
            fullWidth
            onClick={() => setShowTestModal(false)}
            sx={{
              bgcolor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '16px',
              py: 1.5,
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#1E293B', boxShadow: 'none' },
            }}
          >
            Đóng
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
