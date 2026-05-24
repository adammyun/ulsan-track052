UPDATE public.paths SET around_view_url = '/around-views/' || id || '.jpg' WHERE id IN (
  'arch-hakseong-ridge','arch-hakseong-trail','arch-jangseongpo','arch-jungang-market',
  'arch-namgu-riverside','arch-samsan-alley','arch-seonam-shortcut','arch-seongnam-flower',
  'arch-sinjeong-market','arch-sinjeong-mural','arch-taehwa-bridge','arch-taehwa-reeds'
);