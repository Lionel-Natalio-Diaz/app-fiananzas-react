
"use client";

import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { SuccessNotificationModal } from '@/components/shared/SuccessNotificationModal';

export function AppContentWrapper({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useAppContext();

  const handleCloseSuccessModal = () => {
    dispatch({ type: 'HIDE_SUCCESS_MESSAGE' });
  };

  return (
    <>
      {children}
      {state.successMessage && (
        <SuccessNotificationModal
          isOpen={!!state.successMessage}
          message={state.successMessage}
          onClose={handleCloseSuccessModal}
        />
      )}
    </>
  );
}
