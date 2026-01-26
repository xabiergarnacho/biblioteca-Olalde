-- Crear tabla waitlist para notificaciones de disponibilidad
-- Los usuarios pueden suscribirse para ser notificados cuando un libro vuelva a estar disponible

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE(book_id, user_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_waitlist_book_id ON waitlist(book_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON waitlist(notified_at) WHERE notified_at IS NULL;

-- Comentarios para documentar
COMMENT ON TABLE waitlist IS 'Lista de espera para notificar a usuarios cuando un libro vuelva a estar disponible';
COMMENT ON COLUMN waitlist.notified_at IS 'Fecha en que se notificó al usuario (NULL = pendiente de notificar)';

-- Habilitar RLS (Row Level Security)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias suscripciones
CREATE POLICY "Users can view their own waitlist entries"
  ON waitlist FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden añadir sus propias suscripciones
CREATE POLICY "Users can insert their own waitlist entries"
  ON waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propias suscripciones
CREATE POLICY "Users can delete their own waitlist entries"
  ON waitlist FOR DELETE
  USING (auth.uid() = user_id);
