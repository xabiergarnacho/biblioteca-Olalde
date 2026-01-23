import pandas as pd
import numpy as np

# Leer el archivo Excel
print("Leyendo archivo Excel...")
df = pd.read_excel('copia biblioteca (1).xlsx')

print(f"Archivo leído. Filas: {len(df)}, Columnas: {df.columns.tolist()}")

# Mapeo de columnas
mapeo_columnas = {
    'APELLIDO': 'apellido',
    'NOMBRE': 'nombre',
    'TÍTULO': 'titulo',
    'GÉNERO': 'genero',
    'TEMA': 'tema',
    'RECOM.': 'recomendado',
    'CALIFICACIÓN DELIBRIS.ORG': 'calificacion',
    'CÓDIGO': 'codigo',
    'EDITORIAL': 'editorial'
}

# Renombrar columnas
print("\nRenombrando columnas...")
df = df.rename(columns=mapeo_columnas)

# Verificar qué columnas existen después del renombrado
print(f"Columnas después del renombrado: {df.columns.tolist()}")

# Añadir columnas nuevas
print("\nAñadiendo columnas 'disponible' y 'zona'...")
df['disponible'] = True
df['zona'] = 'General'

# Limpiar datos: reemplazar NaN por string vacío
print("\nLimpiando datos (NaN -> string vacío)...")
df = df.fillna('')

# Guardar como CSV
archivo_salida = 'libros_para_supabase.csv'
print(f"\nGuardando resultado en {archivo_salida}...")
df.to_csv(archivo_salida, index=False, encoding='utf-8-sig')

print(f"\nProceso completado!")
print(f"   - Archivo generado: {archivo_salida}")
print(f"   - Total de registros: {len(df)}")
print(f"   - Columnas finales: {df.columns.tolist()}")
