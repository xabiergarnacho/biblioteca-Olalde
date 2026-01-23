import pandas as pd
import os

# --- CONFIGURACIÓN ---
archivo_entrada = 'libros_para_supabase.csv'  # El archivo que generaste antes
archivo_salida = 'libros_finales_con_zonas.csv'
# ---------------------

def asignar_zonas():
    if not os.path.exists(archivo_entrada):
        print(f"Error: No encuentro '{archivo_entrada}'. Asegurate de haber ejecutado el paso anterior.")
        return

    print(f"Leyendo {archivo_entrada}...")
    df = pd.read_csv(archivo_entrada)

    # DICCIONARIO MAESTRO DE ZONAS (Sacado de tu archivo CÓDIGOS.csv)
    # Prefijo : Zona
    mapa_zonas = {
        '01': 'Estudio Mayores',      # Novela Aventuras
        '02': 'Pequeños',             # Novela Bélica
        '03': 'Pequeños',             # Novela Clásica
        '04': 'Pequeños',             # Novela Dramática
        '05': 'Estudio Mayores',      # Fantástica / Ciencia Ficción
        '06': 'Estudio Mayores',      # Novela Histórica
        '07': 'Zona Juvenil',         # Novela Juvenil (Antes era '0')
        '08': 'Pequeños',             # Novela Negra
        '09': 'Pequeños',             # Poesía
        '10': 'General',              # Relato (Antes era '?')
        '11': 'Pequeños',             # Teatro
        '12': 'Sala de Estar',        # Libros Especiales
        '13': 'Pequeños',             # Filosofía
        '14': 'General',              # Novela en Euskera (Antes era '0')
        '15': 'Pequeños',             # Ensayo Arte
        '16': 'Pequeños',             # Ensayo Historia
        '17': 'Pequeños',             # Ensayo Política
        '18': 'Pequeños',             # Novela en Inglés
        '19': 'Pequeños',             # Ensayo Pedagogía
        '20': 'Pequeños',             # Biografía
        '22': 'Primera Planta'        # Alta Formación
    }

    print("Asignando zonas automaticas segun el codigo...")

    def obtener_zona(codigo):
        # Aseguramos que sea texto y cogemos los 2 primeros caracteres
        codigo_str = str(codigo).strip()
        prefijo = codigo_str.split('-')[0] # Cogemos lo que hay antes del primer guion
        
        # Si el prefijo tiene solo 1 dígito (ej: '8'), le añadimos un 0 delante ('08')
        if len(prefijo) == 1 and prefijo.isdigit():
            prefijo = '0' + prefijo
            
        return mapa_zonas.get(prefijo, 'General') # Si no encuentra el código, pone 'General'

    # Aplicamos la función a cada fila
    df['zona'] = df['codigo'].apply(obtener_zona)

    # Guardamos
    print(f"Guardando archivo final: {archivo_salida}")
    df.to_csv(archivo_salida, index=False, encoding='utf-8-sig')
    
    # Resumen
    print("\nRESUMEN DE LIBROS POR ZONA:")
    print(df['zona'].value_counts())
    print(f"\nLISTO! Sube '{archivo_salida}' a Supabase.")

if __name__ == "__main__":
    asignar_zonas()
