"use client";

import React from 'react';
import { Chip } from '@mui/material';

type Props = {
  status?: string;
};

export function ReturnStatusChip({ status }: Props) {
  const label = status ?? 'نامشخص';
  return <Chip label={label} size="small" />;
}

export default ReturnStatusChip;
