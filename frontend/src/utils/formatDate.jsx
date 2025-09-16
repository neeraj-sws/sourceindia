import React from 'react';
import { format } from 'date-fns';

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return format(new Date(dateString), 'yyyy-MM-dd h:mm a');
};