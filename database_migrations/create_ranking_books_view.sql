-- Crear vista ranking_books
-- Esta vista calcula automáticamente el número de likes por libro
-- y ordena los libros por popularidad (más likes primero)

CREATE OR REPLACE VIEW ranking_books AS
SELECT 
  b.*,
  COALESCE(COUNT(l.id) FILTER (WHERE l.liked = true), 0) AS likes_count
FROM books b
LEFT JOIN loans l ON b.id = l.book_id AND l.liked = true
GROUP BY b.id
ORDER BY likes_count DESC;

-- Comentario para documentar la vista
COMMENT ON VIEW ranking_books IS 'Vista que muestra todos los libros con su conteo de likes, ordenados por popularidad descendente';
