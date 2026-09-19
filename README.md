# App.Sorteos 🎟️

App móvil (Expo / React Native) para que los estudiantes gestionen rifas
escolares desde su celular en lugar de anotar todo en papel: configurar la
rifa, vender boletos, registrar quién compró y quién pagó, y exportar la
lista final para el sorteo.

## Qué hace la app

- **Crear una rifa**: nombre, descripción, premio, cantidad de números y
  costo del boleto.
- **Vendedores con nombre propio**: cada estudiante entra con su nombre (sin
  contraseña) y queda registrado como el vendedor de cada boleto que
  registre.
- **Sincronización en tiempo real**: todos los que se unen a una rifa con su
  código de invitación ven, desde su propio celular, qué números están
  disponibles al instante — no se puede vender el mismo número dos veces.
- **Registro de venta simple**: al tocar un número disponible, se captura
  nombre y WhatsApp del comprador y se elige con un botón si **pagó
  completo**, **abonó** (indicando el monto) o quedó **pendiente de pago**.
- **Historial**: las rifas se pueden cerrar cuando termina el sorteo y
  quedan guardadas en un historial separado de las rifas activas.
- **Exportar a Excel**: genera un archivo `.xlsx` con número, comprador,
  WhatsApp, estatus, monto pagado/pendiente y vendedor, listo para subirlo a
  una app de sorteos y elegir al ganador.

## Stack técnico

- [Expo](https://expo.dev) SDK 57 + React Native + TypeScript
- [React Navigation](https://reactnavigation.org) (stack + bottom tabs)
- [Firebase](https://firebase.google.com): Firestore (base de datos en
  tiempo real) + Authentication (sesión anónima por dispositivo)
- [SheetJS (xlsx)](https://sheetjs.com) + `expo-file-system` / `expo-sharing`
  para exportar y compartir el Excel

La app necesita un backend porque varios estudiantes venden boletos de la
**misma** rifa desde celulares distintos: Firestore es lo que mantiene a
todos viendo la misma información al instante.

## Configurar Firebase (una sola vez)

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) y
   crea un proyecto nuevo (gratis, plan Spark es suficiente).
2. En **Compilación → Firestore Database**, crea una base de datos (modo
   producción, la región más cercana a tu escuela).
3. En **Compilación → Authentication → Sign-in method**, habilita el
   proveedor **Anónimo**. No se piden contraseñas: solo se usa para que cada
   celular tenga una identidad y sepamos quién vendió cada boleto.
4. En **Configuración del proyecto → Tus apps**, agrega una app **Web** (el
   ícono `</>`) — aunque la app corra en el celular, el SDK de Firebase para
   Expo/React Native usa la configuración de app web. Copia el objeto
   `firebaseConfig` que te muestra.
5. En la raíz del proyecto, copia `.env.example` a `.env`:

   ```bash
   cp .env.example .env
   ```

   Y llena los valores con los que copiaste en el paso anterior:

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```

   Expo carga automáticamente cualquier variable que empiece con
   `EXPO_PUBLIC_` desde `.env`. Este archivo **no** se sube a git.

6. Despliega las reglas de seguridad y los índices incluidos en el repo
   (`firestore.rules`, `firestore.indexes.json`) con el
   [Firebase CLI](https://firebase.google.com/docs/cli):

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add            # selecciona tu proyecto
   firebase deploy --only firestore
   ```

   Si prefieres no instalar el CLI, puedes pegar el contenido de
   `firestore.rules` directamente en **Firestore Database → Reglas** en la
   consola de Firebase. El índice compuesto de `firestore.indexes.json` se
   puede crear también aceptando el enlace que Firestore muestra en la
   consola del navegador la primera vez que la app hace esa consulta.

## Correr la app

```bash
npm install
npm run start
```

Escanea el código QR con la app **Expo Go** (Android/iOS) o presiona `a` /
`i` en la terminal para abrir un emulador. Todos los estudiantes deben
correr la app apuntando al mismo proyecto de Firebase (el mismo `.env`) para
poder ver las rifas compartidas.

## Cómo lo usan los estudiantes

1. Al abrir la app por primera vez, cada quien escribe su nombre (queda
   guardado en su celular).
2. Uno de ellos crea la rifa desde la pestaña **Rifas activas → + Nueva
   rifa**, indicando cantidad de números, costo del boleto y premio. La app
   genera un **código de invitación** de 6 caracteres.
3. Los demás vendedores tocan **Unirme**, escriben ese código y quedan
   agregados a la rifa — verán la misma cuadrícula de números en tiempo
   real.
4. Para vender un boleto, tocan un número disponible, capturan nombre y
   WhatsApp del comprador, y eligen **Pagó completo**, **Abonó** (con el
   monto) o **Pendiente de pago**.
5. Cuando se agote la rifa o llegue el día del sorteo, quien la creó puede
   **Cerrar rifa** para moverla al historial, y **Exportar a Excel** para
   subir la lista de números y nombres a la app de sorteos que usen para
   elegir al ganador.

## Estructura del proyecto

```
src/
  config/       Inicialización de Firebase (auth + Firestore)
  context/      AuthContext (sesión anónima + perfil del vendedor)
  navigation/   Stack raíz y tabs (Activas / Historial / Perfil)
  screens/      Pantallas de la app
  components/   Cuadrícula de boletos, tarjetas, modal de venta, resumen
  services/     Lógica de Firestore (rifas, boletos) y exportación a Excel
  types/        Tipos compartidos (Raffle, Ticket, UserProfile...)
  utils/        Formato de moneda/fecha, cálculo de totales, código de invitación
firestore.rules            Reglas de seguridad de Firestore
firestore.indexes.json     Índices compuestos necesarios
```

## Notas de seguridad

- La sesión es anónima (sin contraseña) porque el objetivo es que cualquier
  estudiante entre rápido desde su celular; el código de invitación es lo
  que protege cada rifa. No guardes información sensible de los compradores
  más allá de nombre y WhatsApp.
- Las reglas de Firestore permiten que solo los miembros de una rifa (los
  que se unieron con el código) puedan leer o modificar los boletos, y que
  solo quien creó la rifa pueda cerrarla, reabrirla o cambiar su
  configuración.
