# Migración a Flutter

Este documento resume los pasos para reconstruir la aplicación **Fintouch**, creada originalmente con Next.js y React, utilizando Flutter. Siga esta guía para mantener las funcionalidades existentes al pasar a la nueva plataforma.

## 1. Crear un nuevo proyecto

```bash
flutter create fintouch_flutter
cd fintouch_flutter
```

## 2. Configurar Firebase

- Agregue Firebase para Android e iOS siguiendo la [documentación de FlutterFire](https://firebase.flutter.dev/docs/overview).
- Incluya autenticación y Firestore.
- Copie la configuración que se encuentra en `src/lib/firebase.ts` a los archivos `google-services.json` (Android) y `GoogleService-Info.plist` (iOS).

## 3. Modelos y servicios

- Convierta las interfaces de TypeScript definidas en `src/lib/types.ts` a clases de Dart.
- Implemente servicios para autenticación, lecturas y escrituras en Firestore y manejo de estado.

## 4. Replicar pantallas y funciones

- Cree pantallas para inicio de sesión, onboarding, panel principal, categorías, presupuestos e informes.
- Utilice `provider` o `riverpod` para la gestión de estado.
- Reimplemente las funciones de grabación de audio y OCR con `speech_to_text`, `image_picker` y `google_mlkit_ocr` (o paquetes equivalentes).

## 5. Pautas de estilo

Siga las especificaciones de `docs/blueprint.md`:

- **Color primario:** Azul saturado `#4285F4`.
- **Color de fondo:** Azul grisáceo claro `#E8F0FE`.
- **Color de acento:** Verde vívido `#34A853`.
- **Fuentes:** Títulos en "Space Grotesk" y cuerpo en "Inter".
- Use un diseño adaptativo para soportar dispositivos móviles y web.

## 6. Probar e iterar

- Valide los flujos de autenticación y la sincronización con la base de datos.
- Asegúrese de que todas las funcionalidades existentes funcionen igual que en la versión React.

Cada componente y página deberá reimplementarse manualmente utilizando widgets de Flutter. Este resumen se basa en la estructura y los lineamientos presentes en este proyecto.
