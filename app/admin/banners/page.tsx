"use client";
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bannersApi } from '@/lib/api-real';
import { useToast } from '@/hooks/useToast';
import colors from '../../../client-colors';

const formSchema = z.object({
  title: z.string().optional(),
  caption: z.string().optional(),
  order: z.preprocess((v) => Number(v), z.number().optional()),
  isActive: z.boolean().optional(),
  file: z.any().optional(),
});

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(formSchema) });
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  async function load() {
    const data = await bannersApi.getAllBanners();
    setBanners(data || []);
  }

  useEffect(() => { load(); }, []);

  async function onSubmit(values: any) {
    // Validate that an image is provided (either new file or existing when editing)
    if (!values.file && !preview && !editingId) {
      toast({ title: 'تصویر بنر اجباری است', variant: 'destructive' });
      return;
    }

    const fd = new FormData();
    if (values.title) fd.append('title', values.title);
    if (values.caption) fd.append('caption', values.caption);
    if (values.order !== undefined) fd.append('order', String(values.order));
    fd.append('isActive', String(!!values.isActive));
    if (values.file && values.file[0]) fd.append('file', values.file[0]);
    if (removeImage) fd.append('removeImage', 'true');

  setLoading(true);
    try {
      if (editingId) {
        await bannersApi.updateBanner(editingId, fd);
        toast({ title: 'بنر با موفقیت بروزرسانی شد' });
        setEditingId(null);
      } else {
        await bannersApi.createBanner(fd);
        toast({ title: 'بنر با موفقیت ایجاد شد' });
      }
      reset();
      await load();
    } catch (err) {
      toast({ title: editingId ? 'خطا در بروزرسانی بنر' : 'خطا در ایجاد بنر', variant: 'destructive' });
    } finally {
      setLoading(false);
      setPreview(null);
      setRemoveImage(false);
    }
  }

  async function remove(id: string) {
    const ok = window.confirm('آیا از حذف این بنر مطمئن هستید؟');
    if (!ok) return;
    setLoading(true);
    try {
      await bannersApi.deleteBanner(id);
      toast({ title: 'بنر حذف شد' });
      await load();
    } catch (err) {
      toast({ title: 'خطا در حذف بنر', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">مدیریت بنرها</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input {...register('title')} placeholder="عنوان (اختیاری)" className="border p-2 w-full" />
          <input {...register('caption')} placeholder="توضیح کوتاه (اختیاری)" className="border p-2 w-full" />

          <input type="number" {...register('order')} placeholder="ترتیب" className="border p-2 w-full" />

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} /> فعال
          </label>

          <div className="col-span-1 md:col-span-2">
            <input type="file" {...register('file')} className="w-full" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPreview(URL.createObjectURL(f));
                setRemoveImage(false);
              } else {
                setPreview(null);
              }
            }} />

            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="w-full h-auto max-h-48 object-cover rounded mt-2" />
            )}

            {editingId && !preview && (
              banners.find(b => b.id === editingId)?.imageUrl ? (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banners.find(b => b.id === editingId)?.imageUrl} alt="current" className="w-full h-auto max-h-48 object-cover rounded" />
                  <label className="flex items-center gap-2 mt-1">
                    <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} /> حذف تصویر
                  </label>
                </div>
              ) : null
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button type="submit" className="header-btn-primary px-4 py-2 rounded w-full sm:w-auto" disabled={loading}>
            {editingId ? (loading ? 'در حال بروزرسانی...' : 'بروزرسانی') : (loading ? 'در حال ایجاد...' : 'ایجاد')}
          </button>
          {editingId && (
            <button
              type="button"
              className="px-3 py-2 border rounded w-full sm:w-auto"
              onClick={() => { setEditingId(null); reset(); }}
              disabled={loading}
            >انصراف</button>
          )}
        </div>
      </form>

      <div>
        {banners.map(b => (
          <div key={b.id} className="flex items-center justify-between border p-2 mb-2">
            <div className="flex items-center gap-4">
              {b.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.imageUrl} alt={b.title} className="h-20 w-32 object-cover rounded" />
              )}
              <div>
                <div className="font-bold">{b.title}</div>
                <div className="text-sm text-gray-600">{b.caption}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingId(b.id);
                  reset({ title: b.title, caption: b.caption || '', order: b.order ?? undefined, isActive: !!b.isActive });
                }}
                style={{ color: colors.badgeBlue }}
                disabled={loading}
              >
                ویرایش
              </button>
              <button onClick={() => remove(b.id)} style={{ color: colors.danger }} disabled={loading}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
