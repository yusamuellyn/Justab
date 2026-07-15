export const C = {
  deepOcean: '#1E3A5F',
  coolGray: '#C5CDD6',
  coolGrayLight: '#D5DCE4',
  coolGrayBg: '#E4E9EE',
  white: '#FFFFFF',
  muted: '#5A6B7D',
  infoBg: '#EEF2F7',
  error: '#C0392B',
  errorSoft: '#FDF0EE',
};

export const card = {
  backgroundColor: C.white,
  borderRadius: 18,
  paddingVertical: 18,
  paddingHorizontal: 20,
  marginBottom: 14,
  shadowColor: C.deepOcean,
  shadowOpacity: 0.09,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};

export const cardInfo = {
  ...card,
  backgroundColor: C.infoBg,
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

export const primaryBtn = {
  backgroundColor: C.deepOcean,
  borderRadius: 14,
  paddingVertical: 15,
  alignItems: 'center' as const,
  shadowColor: C.deepOcean,
  shadowOpacity: 0.22,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
};

export const backBtn = {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: C.white,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  shadowColor: C.deepOcean,
  shadowOpacity: 0.1,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

export const input = {
  height: 48,
  borderColor: C.coolGrayLight,
  borderWidth: 1,
  borderRadius: 12,
  paddingHorizontal: 16,
  marginBottom: 12,
  backgroundColor: C.coolGrayBg,
  color: C.deepOcean,
  fontSize: 15,
  fontWeight: '500' as const,
};

export const fieldLabel = {
  fontSize: 12,
  fontWeight: '600' as const,
  color: C.muted,
  marginBottom: 8,
  letterSpacing: 0.3,
  textTransform: 'uppercase' as const,
};

export const screenTitle = {
  flex: 1,
  fontSize: 22,
  fontWeight: '700' as const,
  color: C.deepOcean,
  textAlign: 'center' as const,
  marginRight: 38,
  letterSpacing: -0.4,
};

export const rowDivider = {
  borderBottomWidth: 0.5,
  borderBottomColor: C.coolGrayLight,
};
