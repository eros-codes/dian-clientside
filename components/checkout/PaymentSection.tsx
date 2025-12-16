//PaymentSection
'use client';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
} from '@mui/material';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, AccountBalance } from '@mui/icons-material';
import { Price } from '@/components/ui/Price';

interface PaymentSectionProps {
  totalAmount: number;
  value?: 'ONLINE' | 'COD';
  onChange?: (v: 'ONLINE' | 'COD') => void;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

export function PaymentSection({ totalAmount, value, onChange, notes, onNotesChange }: PaymentSectionProps) {
  const selected = value === 'ONLINE' ? 'online' : 'cash';
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        روش پرداخت
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              name="payment-method"
              value={selected}
              onChange={(e) => {
                const v = e.target.value === 'online' ? 'ONLINE' : 'COD';
                onChange?.(v);
              }}
            >
              <FormControlLabel
                value="online"
                control={<Radio disabled />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
                    <CreditCard />
                    <Typography>پرداخت آنلاین (به زودی...)</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="cash"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance />
                    <Typography>پرداخت در صندوق</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
            توضیحات سفارش (اختیاری)
          </Typography>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange?.(e.target.value)}
            placeholder="اگر توضیحات خاصی برای سفارش خود دارید، اینجا بنویسید..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              مبلغ قابل پرداخت:
            </Typography>
            <Price amount={totalAmount} variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }} />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}