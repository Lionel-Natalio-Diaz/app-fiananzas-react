# Fintouch Flutter

Este directorio contiene una versión inicial de la aplicación Fintouch hecha en Flutter.
Incluye modelos convertidos desde TypeScript y un punto de entrada básico.

## Uso rápido

```bash
flutter pub get
flutter run
```

El tema de la aplicación se define en `lib/theme.dart` siguiendo la paleta y tipografías descritas en `docs/blueprint.md`.
Se utiliza `provider` para un estado simple en `lib/providers/app_state.dart`.

Para la configuración de Firebase copie las credenciales de `src/lib/firebase.ts` a los
archivos `google-services.json` y `GoogleService-Info.plist` de cada plataforma.
