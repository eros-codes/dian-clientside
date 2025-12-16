'use client';

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table as MuiTable,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/stores/authStore';
import { useDiningTables, createDiningTable, updateDiningTable, deleteDiningTable } from '@/hooks/useDiningTables';
import { DiningTable } from '@/types';
import colors from '../../../../client-colors';

interface TableFormState {
  staticId: string;
  name: string;
  description: string;
  isActive: boolean;
}

const initialForm: TableFormState = {
  staticId: '',
  name: '',
  description: '',
  isActive: true,
};

export default function AdminDiningTablesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: tables, isLoading, mutate } = useDiningTables();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<TableFormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null);

  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <AppShell>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Card elevation={0} sx={{ border: `1px solid ${colors.borderLight}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: colors.danger, mb: 2, fontWeight: 700 }}>
                🔒 دسترسی غیرمجاز
              </Typography>
              <Typography variant="body1" sx={{ color: colors.textSecondary }}>
                شما به این بخش دسترسی ندارید. لطفاً با اکانت ادمین وارد شوید.
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </AppShell>
    );
  }

  const handleOpenCreate = () => {
    setEditingTable(null);
    setFormState(initialForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (table: DiningTable) => {
    setEditingTable(table);
    setFormState({
      staticId: table.staticId,
      name: table.name,
      description: table.description ?? '',
      isActive: table.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingTable(null);
  };

  const handleChange = (field: keyof TableFormState, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formState.staticId.trim() || !formState.name.trim()) {
      alert('لطفاً شناسه ثابت و نام میز را وارد کنید');
      return;
    }

    const payload: Partial<DiningTable> = {
      staticId: formState.staticId.trim(),
      name: formState.name.trim(),
      description: formState.description.trim() ? formState.description.trim() : undefined,
      isActive: formState.isActive,
    };

    try {
      setSaving(true);
      if (editingTable) {
        await updateDiningTable(editingTable.id, payload);
        alert('میز بروزرسانی شد');
      } else {
        await createDiningTable(payload);
        alert('میز جدید ایجاد شد');
      }
      await mutate();
      setDialogOpen(false);
      setEditingTable(null);
    } catch (error: any) {
      alert(error?.message || 'خطا در ذخیره تغییرات');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: DiningTable) => {
    const confirmDelete = window.confirm(`آیا از حذف میز «${table.name}» مطمئن هستید؟`);
    if (!confirmDelete) return;

    try {
      await deleteDiningTable(table.id);
      await mutate();
      alert('میز حذف شد');
    } catch (error: any) {
      alert(error?.message || 'خطا در حذف میز');
    }
  };

  return (
    <AppShell>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              مدیریت میزها
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ایجاد، ویرایش و مدیریت میزهای فعال برای صدور QR
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
            افزودن میز جدید
          </Button>
        </Box>

        <Card>
          <CardContent>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : tables && tables.length > 0 ? (
              <MuiTable>
                <TableHead>
                  <TableRow>
                    <TableCell>شناسه ثابت</TableCell>
                    <TableCell>نام میز</TableCell>
                    <TableCell>توضیحات</TableCell>
                    <TableCell align="center">وضعیت</TableCell>
                    <TableCell align="center">اقدامات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tables.map(table => (
                    <TableRow key={table.id} hover>
                      <TableCell>{table.staticId}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{table.name}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>{table.description || '-'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={table.isActive ? 'فعال' : 'غیرفعال'}
                          color={table.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => handleOpenEdit(table)}
                          >
                            ویرایش
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<Delete />}
                            onClick={() => handleDelete(table)}
                          >
                            حذف
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </MuiTable>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  هنوز میزی ثبت نشده است
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  برای شروع، دکمه «افزودن میز جدید» را بزنید.
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
                  افزودن اولین میز
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingTable ? 'ویرایش میز' : 'افزودن میز جدید'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="شناسه ثابت (staticId)"
              value={formState.staticId}
              onChange={event => handleChange('staticId', event.target.value)}
              placeholder="مثال: table-01"
              disabled={!!editingTable}
              required
            />
            <TextField
              label="نام میز"
              value={formState.name}
              onChange={event => handleChange('name', event.target.value)}
              placeholder="مثال: میز شماره ۱"
              required
            />
            <TextField
              label="توضیحات"
              value={formState.description}
              onChange={event => handleChange('description', event.target.value)}
              multiline
              minRows={2}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formState.isActive}
                  onChange={event => handleChange('isActive', event.target.checked)}
                  color="primary"
                />
              }
              label="میز فعال باشد"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            انصراف
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
