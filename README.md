# Demostración de mensajería con NestJS y RabbitMQ

## 1. Objetivo de la demostración

Este proyecto muestra un flujo mínimo y real de comunicación asíncrona entre dos servicios NestJS:

- `producer`: expone un endpoint HTTP y publica un mensaje.
- `consumer`: recibe el mensaje, lo procesa y devuelve una respuesta.
- `rabbitmq`: actúa como intermediario (broker) para transportar mensajes entre ambos servicios.

La idea es demostrar el patron request/reply sobre RabbitMQ de forma simple, clara y reproducible.

---

## 2. Que es RabbitMQ

RabbitMQ es un sistema de mensajería (message broker) que implementa principalmente AMQP (Advanced Message Queuing Protocol). Su función es recibir mensajes de productores, enrutarlos y entregarlos a consumidores de manera confiable.

RabbitMQ permite:

- desacoplar servicios que no deben llamarse directamente,
- procesar tareas de forma asíncrona,
- absorber picos de carga mediante colas,
- mejorar resiliencia en arquitecturas distribuidas.

En lugar de que un servicio A dependa de una llamada HTTP directa a un servicio B, A publica un mensaje en RabbitMQ y B lo procesa cuando lo recibe.

---

## 3. Que es un broker de mensajes

Un broker de mensajes es un componente intermedio que administra el intercambio de mensajes entre aplicaciones.

Sus responsabilidades principales son:

- recibir mensajes de productores,
- almacenarlos temporalmente en colas,
- entregarlos a consumidores,
- aplicar reglas de enrutamiento,
- gestionar confirmaciones y confiabilidad de entrega.

Esto reduce el acoplamiento entre servicios y facilita evolucionar sistemas complejos sin romper integraciones existentes.

---

## 4. Donde se usa este tipo de arquitectura

RabbitMQ y los brokers de mensajes se usan comúnmente en:

- arquitecturas de microservicios,
- sistemas event-driven,
- procesamiento en segundo plano (background jobs),
- integraciones entre sistemas heterogéneos,
- pipelines de procesamiento (pagos, notificaciones, facturación, auditoria),
- escenarios de alta concurrencia donde conviene desacoplar productor y consumidor.

También es habitual en patrones como:

- pub/sub,
- work queues,
- request/reply asíncrono,
- sagas y orquestación de procesos distribuidos.

---

## 5. Arquitectura de esta demo

Componentes:

- `producer` (NestJS, puerto `3000` por defecto)
- `consumer` (NestJS, puerto `3001` por defecto)
- `rabbitmq` (Docker Compose, puertos `5672` y `15672`)

Flujo funcional:

1. Cliente invoca `GET /send?message=...` en `producer`.
2. `producer` publica un mensaje a RabbitMQ.
3. RabbitMQ enruta el mensaje a la cola `demo_queue`.
4. `consumer` escucha la cola con `@MessagePattern('demo_queue')`.
5. `consumer` procesa el contenido y genera una respuesta.
6. RabbitMQ entrega la respuesta al `producer` (request/reply).
7. `producer` responde al cliente HTTP con el resultado final.

Representación simplificada:

```text
Cliente HTTP
   |
   v
Producer --(mensaje)--> RabbitMQ (broker/cola) --(entrega)--> Consumer
   ^                                                             |
   |------------------------(respuesta procesada)----------------|
```

---

## 6. Requisitos previos

Antes de ejecutar la demo necesitas:

- Docker y Docker Compose instalados,
- Node.js y npm instalados,
- puertos libres: `3000`, `3001`, `5672`, `15672`.

Nota: si no tienes la imagen localmente, `docker compose up` la descargara automáticamente (equivalente a `docker pull rabbitmq`).

---

## 7. Instalación del proyecto

Desde la raíz del repositorio:

```bash
npm install --prefix producer
npm install --prefix consumer
```

Desde los servicios:

```bash
cd producer
npm install
cd ..
cd consumer
npm install
```

Esto instala todas las dependencias de ambos servicios NestJS.

---

## 8. Levantar la infraestructura (RabbitMQ)

El `docker-compose.yaml` ya define el servicio con credenciales de demo:

- usuario: `admin`
- password: `admin`
- host AMQP: `localhost:5672`
- portal de administración: `http://localhost:15672`

En producción, NUNCA utilizar estas credenciales, utilizar credenciales fuertes para evitar potenciales vulnerabilidades de seguridad, las credenciales expuestas son solo para facilitar los propósitos didácticos de este proyecto.

Inicia RabbitMQ:

```bash
docker compose up -d rabbitmq
```

Verifica estado:

```bash
docker compose ps
```

Acceso al panel de administración de RabbitMQ:

- URL: `http://localhost:15672`
- Usuario: `admin`
- Password: `admin`

Detener infraestructura:

```bash
docker compose down
```

---

## 9. Levantar los servicios de aplicación

Abre dos terminales.

Terminal 1 (consumer):

```bash
npm run start --prefix consumer
```

o

```bash
cd consumer
npm run start
```

Terminal 2 (producer):

```bash
npm run start --prefix producer
```

o

```bash
cd consumer
npm run start
```

Valores por defecto usados por el código:

- `RABBITMQ_URL=amqp://admin:admin@localhost:5672`
- `RABBITMQ_QUEUE=demo_queue`

Puedes sobreescribirlos con variables de entorno si lo necesitas.

---

## 10. Ejemplo de uso

Con RabbitMQ y ambos servicios activos, ejecuta desde una nueva terminal:

```bash
curl "http://localhost:3000/send?message=hola-rabbit"
```

### Ejemplo de respuesta

```json
{
    "producerStatus": "message sent",
    "sentMessage": "hola-rabbit",
    "consumerResponse": {
        "status": "processed",
        "processedMessage": "Consumer recibio: hola-rabbit",
        "processedAt": "2026-04-08T23:29:57.264Z"
    }
}
```

Interpretación:

- `producerStatus`: confirma que el producer envió el mensaje al broker,
- `sentMessage`: payload original enviado,
- `consumerResponse`: respuesta generada por el consumer luego del procesamiento.

### Panel de administración

A traves del panel de administración podemos observar el comportamiento y monitorear tanto el estado de la cola y los mensajes enviados.

<div style="text-align: center;">
  <img src="images/rabbitmq-dashboard.png" alt="Panel de Administración">
  <p style="font-size: 0.9em; font-style: italic;">Panel de Administración RabbitMQ</p>
</div>

---

## 11. Puntos técnicos clave de la implementación

- El producer usa `ClientProxy` de `@nestjs/microservices` para enviar mensajes RMQ.
- El consumer registra un microservicio RMQ y maneja mensajes con `@MessagePattern`.
- Ambos comparten la misma cola de demo (`demo_queue`).
- La comunicación es asíncrona a nivel transporte, pero expuesta como request/reply para la demo.

Archivos principales:

- `producer/src/app.controller.ts`
- `producer/src/app.service.ts`
- `producer/src/app.module.ts`
- `consumer/src/main.ts`
- `consumer/src/app.controller.ts`
- `consumer/src/app.service.ts`
- `docker-compose.yaml`

---

## 12. Conclusiones

Esta demostración valida un caso base de mensajería con RabbitMQ en un entorno de microservicios NestJS:

- se desacopla el emisor del procesador,
- se centraliza el transporte en un broker,
- se implementa un flujo request/reply funcional,
- se obtiene una base lista para evolucionar a escenarios reales (reintentos, DLQ, persistencia, observabilidad, escalado horizontal).

Con este fundamento, el siguiente paso natural es ampliar la demo hacia patrones event-driven y tolerancia a fallos. Los invitamos formalmente a seguir iterando sobre este mismo concepto, modificar elementos, agregar otra cola y que sea procesada por el consumer, agregar otro consumidor con una base de datos y que devuelva datos guardados, entre otras.

Esperamos que les sea de utilidad para sus futuras implementaciones y arquitecturas.
