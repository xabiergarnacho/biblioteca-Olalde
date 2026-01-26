-- Añadir columna 'liked' a la tabla loans
-- Esta columna almacena si al usuario le gustó el libro (true) o no (false/null)

ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS liked BOOLEAN DEFAULT NULL;

-- Comentario para documentar la columna
COMMENT ON COLUMN loans.liked IS 'Indica si al usuario le gustó el libro: true = me gustó, false = normal, null = sin valorar';
