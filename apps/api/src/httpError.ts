export type HttpErrorDescription = {
  status: number;
  publicMessage: string;
  shouldLog: boolean;
};

export function describeHttpError(error: unknown): HttpErrorDescription {
  const message = error instanceof Error ? error.message : "Error interno del servidor.";
  const normalized = message.toLocaleLowerCase("es");
  const databaseCode = typeof error === "object" && error && "code" in error ? String(error.code) : undefined;
  const explicitStatus = typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
  const status =
    explicitStatus && [400, 413, 422, 429, 502, 503].includes(explicitStatus)
      ? explicitStatus
      : databaseCode === "23505"
        ? 409
        : databaseCode === "23503" || databaseCode === "22P02"
          ? 400
          : ["no se encontro", "no existe", "no encontrado", "no encontrada"].some((fragment) => normalized.includes(fragment))
            ? 404
            : ["no está configurad", "no esta configurad"].some((fragment) => normalized.includes(fragment))
              ? 503
            : ["la ia no devolvió", "la ia no devolvio"].some((fragment) => normalized.includes(fragment))
              ? 502
            : ["no se detectaron", "respuesta vacía", "respuesta vacia", "inventario no tiene productos"].some((fragment) => normalized.includes(fragment))
              ? 422
              : ["stock insuficiente", "cupo", "deuda pendiente", "caja ya", "caja cerrada", "ya fue", "ya está registrad", "ya esta registrad", "ya existe", "está bloqueado", "esta bloqueado", "supera el límite", "supera el limite"].some((fragment) => normalized.includes(fragment))
                ? 409
                : [
                    "requerid",
                    "obligator",
                    "no contiene",
                    "máximo",
                    "maximo",
                    "confirma",
                    "no se pudo importar ningún",
                    "no se pudo importar ningun",
                    "inval",
                    "incorrect",
                    "debe",
                    "cantidad",
                    "monto",
                    "no coincide",
                    "no permite",
                    "agotad",
                    "formato",
                    "demasiado pesada"
                  ].some((fragment) => normalized.includes(fragment))
                  ? 400
                  : 500;

  const publicMessage = status === 413
    ? explicitStatus === 413
      ? message
      : "La imagen es demasiado pesada. Usa una foto de menor resolución."
    : databaseCode === "23505"
      ? "Ya existe un registro con esos datos."
      : status === 500
        ? "Error interno del servidor."
        : message;

  return { status, publicMessage, shouldLog: status === 500 };
}
