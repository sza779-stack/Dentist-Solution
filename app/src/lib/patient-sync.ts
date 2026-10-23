import type { QueryClient, QueryKey } from '@tanstack/react-query';

const invalidateMany = (queryClient: QueryClient, keys: QueryKey[]) => {
  keys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
};

const refetchMany = (queryClient: QueryClient, keys: QueryKey[]) => {
  keys.forEach((queryKey) => {
    queryClient.refetchQueries({ queryKey, type: 'active' });
  });
};

export const syncPatientData = (queryClient: QueryClient, patientId?: string) => {
  const patientScopedKeys: QueryKey[] = patientId
    ? [
        ['patient', patientId],
        ['patientAppointments', patientId],
        ['patientInvoices', patientId],
        ['patientPrescriptions', patientId],
        ['toothTreatments', patientId],
      ]
    : [
        ['patient'],
        ['patientAppointments'],
        ['patientInvoices'],
        ['patientPrescriptions'],
        ['toothTreatments'],
      ];

  invalidateMany(queryClient, [
    ...patientScopedKeys,
    ['patients'],
    ['invoices'],
    ['payments'],
    ['billing', 'stats'],
    ['patientPortal'],
  ]);

  refetchMany(queryClient, [['patientPortal']]);
};
