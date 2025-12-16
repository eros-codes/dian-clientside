"use client";

import React from 'react';
import { Box, Button, TextField } from '@mui/material';

export default function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <Box component="form" onSubmit={(e) => { e.preventDefault(); onSuccess?.(); }}>
      <TextField label="ایمیل" name="email" fullWidth margin="normal" />
      <TextField label="رمز عبور" name="password" type="password" fullWidth margin="normal" />
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>ورود</Button>
    </Box>
  );
}
